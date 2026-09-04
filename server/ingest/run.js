// Orchestrates one import: input text -> wanted songs -> metadata -> audio ->
// Song rows. Progress is written to the ImportJob document as it goes.
const fs = require("fs");
const path = require("path");
const Song = require("../models/song");
const Category = require("../models/category");
const ImportJob = require("../models/importJob");
const { resolveInput } = require("./sources");
const { itunesLookup, norm } = require("./metadata");
const yt = require("./youtube");

const { execFileSync } = require("child_process");

const AUDIO_DIR = process.env.AUDIO_DIR || path.resolve(__dirname, "..", "..", "audio");
const CONCURRENCY = parseInt(process.env.INGEST_CONCURRENCY || "2", 10);
// When the downloader is not the game server (YouTube blocks the droplet), MP3s
// are rsynced there and songs stay pending (invisible to games) until they land.
const SYNC_TARGET = process.env.SYNC_TARGET; // e.g. root@1.2.3.4:/opt/partyy/audio/

function syncAudio() {
  execFileSync("rsync", ["-az", "--ignore-existing", "--exclude", "*.part", "--exclude", "*.webm", "--exclude", "*.m4a", AUDIO_DIR.replace(/\/?$/, "/"), SYNC_TARGET], {
    stdio: "inherit",
    timeout: 60 * 60 * 1000,
  });
}

async function log(job, line) {
  job.log.push(new Date().toISOString().slice(11, 19) + " " + line);
  if (job.log.length > 500) job.log = job.log.slice(-500);
  await job.save();
}

// One wanted song end to end. Returns "added" | "skipped" | throws.
async function ingestOne(job, category, existing, added, want) {
  const meta = await itunesLookup(want.title, want.artist, { ambiguous: want.ambiguous });
  const title = meta ? meta.title : want.title;
  const artist = meta ? meta.artist : [want.artist].filter(Boolean);
  const key = norm(title) + "|" + norm(artist[0] || "");
  if (existing.has(key)) return "skipped";

  const cands = await yt.candidates(title, artist[0] || "");
  const pick = yt.pickBest(cands, meta ? meta.durationMs / 1000 : undefined);
  if (!pick) throw new Error("no YouTube match" + (meta ? "" : " (and no iTunes match)"));

  const song = new Song({
    title,
    artist,
    artUrl: meta ? meta.artUrl : undefined,
    categoryId: category._id + "",
    youtubeId: pick.id,
    source: "youtube",
    pending: SYNC_TARGET ? true : undefined,
  });
  const file = await yt.download(pick.id, AUDIO_DIR, song._id + "");
  song.audioFile = path.basename(file);
  song.duration = await yt.probeDuration(file);
  if (!song.duration || song.duration < 40) {
    fs.unlinkSync(file);
    throw new Error("audio too short: " + song.duration);
  }
  await song.save();
  existing.add(key);
  added.push(song._id);
  return "added";
}

async function runImport(jobId, { beforeDone } = {}) {
  const job = await ImportJob.findById(jobId);
  if (!job) throw new Error("no such job " + jobId);
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  job.status = "running";
  await job.save();
  try {
    const src = await resolveInput(job.input);
    const categoryName = (job.categoryName || src.name || "").trim();
    if (!categoryName) throw new Error("no category name given and the source has no name");
    let category = await Category.findOne({ name: categoryName });
    if (!category) category = await new Category({ name: categoryName }).save();
    job.categoryId = category._id + "";
    job.total = src.items.length;
    await log(job, `source=${src.kind} songs=${src.items.length} category="${categoryName}"` + (src.capped ? " (Spotify embed only exposes the first 100 tracks; paste the rest as a list)" : ""));

    const existing = new Set(
      (await Song.find({ categoryId: category._id + "" })).map((s) => norm(s.title) + "|" + norm((s.artist || [])[0] || ""))
    );

    const added = []; // song ids this job created
    let next = 0;
    // Every ~25 songs, push what we have so games can start using them early.
    let sinceSync = 0;
    const flush = async () => {
      if (!SYNC_TARGET || added.length === 0) return;
      syncAudio();
      const ids = added.splice(0, added.length);
      await Song.updateMany({ _id: { $in: ids } }, { $unset: { pending: 1 } });
      await log(job, `synced ${ids.length} songs to the game server`);
    };
    const worker = async () => {
      while (next < src.items.length) {
        const want = src.items[next++];
        try {
          const r = await ingestOne(job, category, existing, added, want);
          if (r === "added") job.done += 1;
          else job.skipped += 1;
          await log(job, `${r}: ${want.title} - ${want.artist}`);
          if (r === "added" && ++sinceSync >= 25) {
            sinceSync = 0;
            await flush().catch((e) => log(job, "sync failed (will retry at end): " + e.message));
          }
        } catch (e) {
          job.failed.push({ title: want.title, artist: want.artist, reason: e.message.slice(0, 200) });
          await log(job, `FAILED: ${want.title} - ${want.artist}: ${e.message.slice(0, 120)}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, src.items.length) }, worker));
    if (SYNC_TARGET) {
      await log(job, "syncing audio to the game server");
      await flush();
    }
    if (beforeDone) await beforeDone(job);
    job.status = "done";
  } catch (e) {
    job.status = "failed";
    job.error = e.message;
  }
  job.finished = new Date();
  await job.save();
  return job;
}

module.exports = { runImport, AUDIO_DIR };
