// Find the right YouTube upload for a song and download it as MP3.
const { execFile } = require("child_process");
const path = require("path");

const YTDLP = process.env.YTDLP_BIN || "yt-dlp";
const FFPROBE = process.env.FFPROBE_BIN || "ffprobe";

function run(bin, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 10 * 1024 * 1024, timeout: 240000, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || err.message).trim().split("\n").slice(-2).join(" | ")));
      resolve(stdout);
    });
  });
}

async function search(query) {
  const out = await run(YTDLP, [
    "-q", "--no-warnings", "--flat-playlist",
    "--print", "%(id)s\t%(duration)s\t%(channel)s\t%(title)s",
    `ytsearch6:${query}`,
  ]);
  return out
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [id, duration, channel, t] = l.split("\t");
      return { id, duration: parseFloat(duration) || 0, channel: channel || "", title: t || "" };
    });
}

// Candidates, no download. Retries with a plainer query when the first search
// returns nothing (punctuation like "P!nk" or long feat. credits can confuse it).
async function candidates(title, artist) {
  const plain = (title || "").replace(/\s*[\(\[][^\)\]]*[\)\]]/g, "").trim();
  const queries = [`${title} ${artist}`];
  if (plain && plain !== title) queries.push(`${plain} ${artist}`);
  queries.push(`${plain || title} ${artist} audio`.replace(/[^\w\s&'.-]/g, " "));
  for (const q of queries) {
    let c = [];
    try {
      c = await search(q);
    } catch (e) {
      /* try next */
    }
    if (c.length) return c;
  }
  return [];
}

const BAD_WORDS = ["live", "cover", "remix", "reaction", "karaoke", "instrumental", "sped up", "slowed", "nightcore", "8d", "tutorial", "lesson", "acoustic version", "choreography", "dance practice", "dance cover", "fan made", "mashup"];
// Words that mark a wrong upload, unless the song is actually called that ("Live Your Life").
function badRegex(wantTitle) {
  const t = (wantTitle || "").toLowerCase();
  const words = BAD_WORDS.filter((w) => !t.includes(w));
  return new RegExp("\\b(" + words.join("|") + ")\\b", "i");
}

// Score: duration close to the reference wins, official/topic channels get a
// nudge, obviously-wrong uploads are dropped.
function pickBest(cands, refDurationSec, wantTitle) {
  const BAD = badRegex(wantTitle);
  let best = null;
  let bestScore = -Infinity;
  for (const c of cands) {
    if (!c.id || c.duration <= 0) continue;
    if (BAD.test(c.title)) continue;
    if (c.duration > 900) continue; // no 15-minute "full album" uploads
    let score = 0;
    if (refDurationSec) {
      const diff = Math.abs(c.duration - refDurationSec);
      if (diff > 45) continue; // wrong song or a different version
      score -= diff;
    }
    if (/ - Topic$/.test(c.channel)) score += 15; // auto-generated official audio
    if (/VEVO$/i.test(c.channel) || /official/i.test(c.title)) score += 8;
    if (/lyrics?/i.test(c.title)) score += 2; // lyric uploads are usually clean audio
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

async function download(youtubeId, outDir, baseName) {
  const outTemplate = path.join(outDir, baseName + ".%(ext)s");
  const out = await run(YTDLP, [
    "-q", "--no-warnings", "--no-playlist",
    "-x", "--audio-format", "mp3", "--audio-quality", "128K",
    "-o", outTemplate,
    "--print", "after_move:filepath",
    `https://www.youtube.com/watch?v=${youtubeId}`,
  ]);
  const file = out.trim().split("\n").pop();
  if (!file) throw new Error("yt-dlp produced no file");
  return file;
}

async function probeDuration(file) {
  const out = await run(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return parseFloat(out.trim());
}

module.exports = { candidates, pickBest, download, probeDuration };
