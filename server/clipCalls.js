// Streams the current round's 30-second window of a self-hosted song.
// The URL only carries a game id, so it never leaks the answer.
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const Game = require("./models/game");
const { AUDIO_DIR } = require("./ingest/run");

const FFMPEG = process.env.FFMPEG_BIN || "ffmpeg";
const CLIP_SECONDS = 30;

const clip = async (req, res) => {
  const game = await Game.findById(req.params.gameId).catch(() => null);
  if (!game || !game.song || !game.song.audioFile || game.clipStart == null) {
    return res.status(404).send({ msg: "no clip for this game" });
  }
  // Only the current round's clip is served; old rounds are answers already.
  if (String(game.roundNumber) !== String(req.params.round)) {
    return res.status(410).send({ msg: "round is over" });
  }
  const file = path.join(AUDIO_DIR, path.basename(game.song.audioFile));
  if (!fs.existsSync(file)) return res.status(404).send({ msg: "audio missing" });

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  const ff = spawn(FFMPEG, [
    "-hide_banner", "-loglevel", "error",
    "-ss", String(game.clipStart),
    "-t", String(CLIP_SECONDS),
    "-i", file,
    "-vn",
    "-af", `afade=t=in:d=0.4,afade=t=out:st=${CLIP_SECONDS - 0.6}:d=0.6`,
    "-codec:a", "libmp3lame", "-b:a", "128k",
    "-f", "mp3", "pipe:1",
  ]);
  ff.stdout.pipe(res);
  ff.stderr.on("data", (d) => console.log("ffmpeg:", d.toString().trim()));
  ff.on("error", (e) => {
    console.log("ffmpeg spawn failed:", e.message);
    if (!res.headersSent) res.status(500).end();
  });
  req.on("close", () => ff.kill("SIGKILL"));
};

module.exports = { clip };
