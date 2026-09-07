// Admin library page: the whole song table plus row/category actions.
const fs = require("fs");
const path = require("path");
const Song = require("./models/song");
const Category = require("./models/category");
const Room = require("./models/room");
const ImportJob = require("./models/importJob");
const { AUDIO_DIR } = require("./ingest/run");

const admin = (req, res) => {
  if (!req.user || !req.user.isSiteAdmin) {
    res.status(403).send({ msg: "admin only" });
    return false;
  }
  return true;
};

const library = async (req, res) => {
  if (!admin(req, res)) return;
  const categories = await Category.find({}).sort({ isDefault: -1, _id: 1 }).lean();
  const songs = await Song.find({}).lean();
  res.send({
    categories: categories.map((c) => ({ _id: c._id, name: c.name, isDefault: !!c.isDefault })),
    songs: songs.map((s) => ({
      _id: s._id,
      title: s.title,
      artist: s.artist || [],
      artUrl: s.artUrl,
      categoryId: s.categoryId,
      duration: s.duration,
      youtubeId: s.youtubeId,
      releaseYear: s.releaseYear,
      requested: s.requested,
      pending: !!s.pending,
      bad: !!s.bad,
      legacy: !s.audioFile, // still on a fixed Spotify preview clip
      added: s._id.getTimestamp(),
    })),
  });
};

const updateSong = async (req, res) => {
  if (!admin(req, res)) return;
  const set = {};
  if (typeof req.body.title === "string" && req.body.title.trim()) set.title = req.body.title.trim();
  if (Array.isArray(req.body.artist)) set.artist = req.body.artist.map((a) => String(a).trim()).filter(Boolean);
  if (req.body.categoryId) {
    const c = await Category.findById(req.body.categoryId);
    if (!c) return res.status(400).send({ msg: "no such category" });
    set.categoryId = c._id + "";
  }
  if (typeof req.body.releaseYear === "number") set.releaseYear = req.body.releaseYear;
  const song = await Song.findByIdAndUpdate(req.body.id, { $set: set }, { new: true });
  if (!song) return res.status(404).send({ msg: "no such song" });
  res.send({ ok: true });
};

const deleteSong = async (req, res) => {
  if (!admin(req, res)) return;
  const song = await Song.findById(req.body.id);
  if (!song) return res.status(404).send({ msg: "no such song" });
  if (song.audioFile) {
    try { fs.unlinkSync(path.join(AUDIO_DIR, path.basename(song.audioFile))); } catch (e) {}
  }
  await song.deleteOne();
  res.send({ ok: true });
};

// Queue a job that swaps this song's audio for a hand-picked YouTube video.
const refetchSong = async (req, res) => {
  if (!admin(req, res)) return;
  const m = String(req.body.youtube || "").match(/(?:v=|youtu\.be\/|shorts\/|^)([A-Za-z0-9_-]{11})(?:[&?#]|$)/);
  if (!m) return res.status(400).send({ msg: "paste a YouTube link or 11-character video id" });
  const song = await Song.findById(req.body.id);
  if (!song) return res.status(404).send({ msg: "no such song" });
  const job = await new ImportJob({
    categoryName: "(re-fetch) " + song.title,
    input: req.body.youtube,
    refetchSongId: song._id + "",
    youtubeId: m[1],
  }).save();
  // INGEST_MODE=local would spawn here like importSongs; on the droplet the Mac worker picks it up.
  if ((process.env.INGEST_MODE || "local") === "local") {
    const { spawn } = require("child_process");
    spawn(process.execPath, [path.resolve(__dirname, "..", "scripts", "ingest.js"), "--job", job._id + ""], { cwd: path.resolve(__dirname, ".."), stdio: "inherit", env: process.env });
  }
  res.send({ ok: true, jobId: job._id });
};

const updateCategory = async (req, res) => {
  if (!admin(req, res)) return;
  const c = await Category.findById(req.body.id);
  if (!c) return res.status(404).send({ msg: "no such category" });
  if (typeof req.body.name === "string" && req.body.name.trim()) {
    c.name = req.body.name.trim();
    await c.save();
    // rooms embed a copy of the category
    await Room.updateMany({ "category._id": c._id }, { $set: { "category.name": c.name } });
  }
  if (req.body.makeDefault) {
    await Category.updateMany({}, { $set: { isDefault: false } });
    await Category.updateOne({ _id: c._id }, { $set: { isDefault: true } });
  }
  res.send({ ok: true });
};

module.exports = { library, updateSong, deleteSong, refetchSong, updateCategory };
