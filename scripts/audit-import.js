#!/usr/bin/env node
// Compare imported songs against a reference list (data/akshaj-songs.json) and
// flag rows whose stored title/artist drift from what was asked for, plus the
// YouTube upload title, so wrong versions (remixes, covers, karaoke) stand out.
//   DATABASE_NAME=partyy node scripts/audit-import.js [--fix]   (--fix deletes flagged rows so a rerun re-imports them)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Song = require("../server/models/song");
const Category = require("../server/models/category");
const { norm } = require("../server/ingest/metadata");

const BAD = /\b(nightcore|karaoke|kidz bop|cover|remix|live|instrumental|sped up|slowed|8d|tribute|in the style of|backing)\b/i;
const words = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 1));
const overlap = (a, b) => [...words(a)].filter((w) => words(b).has(w)).length;

async function main() {
  await mongoose.connect(process.env.ATLAS_SRV, { useNewUrlParser: true, useUnifiedTopology: true, dbName: process.env.DATABASE_NAME });
  const ref = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "data", "akshaj-songs.json"), "utf8"));
  const cats = Object.fromEntries((await Category.find({})).map((c) => [c._id + "", c.name]));
  const songs = await Song.find({ audioFile: { $exists: true } });
  const flagged = [];
  for (const s of songs) {
    const catName = cats[s.categoryId];
    // Which reference row was this? Prefer what the import recorded; else the
    // row with the best combined title + artist overlap in the same category.
    let best = null, bestScore = 0;
    if (s.requested && s.requested.title) best = { title: s.requested.title, artist: s.requested.artist || "" };
    else {
      for (const r of ref.filter((r) => r.category === catName)) {
        const t = overlap(r.title, s.title) / Math.max(words(r.title).size, 1);
        const a = overlap(r.artist.split(";")[0], (s.artist || []).join(" ")) > 0 ? 1 : 0;
        const sc = t + a;
        if (sc > bestScore) { bestScore = sc; best = r; }
      }
    }
    const reasons = [];
    const titleScore = best ? overlap(best.title, s.title) / Math.max(words(best.title).size, 1) : 0;
    const artistOk = best && overlap(best.artist.split(";")[0], (s.artist || []).join(" ")) > 0;
    if (!best || (titleScore < 0.5 && !artistOk)) reasons.push("no reference match" + (best ? " (closest: " + best.title + ")" : ""));
    else if (!artistOk) reasons.push("artist differs: wanted " + best.artist.split(";")[0]);
    else if (titleScore < 0.5) reasons.push("title differs: wanted " + best.title);
    if (BAD.test(s.title) && !(best && BAD.test(best.title))) reasons.push("variant word in title");
    if (s.duration && best && s.duration > 600) reasons.push("very long: " + Math.round(s.duration) + "s");
    if (reasons.length) flagged.push({ id: s._id + "", cat: catName, title: s.title, artist: (s.artist || [])[0], yt: s.youtubeId, reasons });
  }
  console.log(`audited ${songs.length} imported songs; flagged ${flagged.length}`);
  flagged.forEach((f) => console.log(` - [${f.cat}] ${f.title} | ${f.artist} (yt ${f.yt}) -> ${f.reasons.join("; ")}`));
  if (process.argv.includes("--fix") && flagged.length) {
    const AUDIO_DIR = process.env.AUDIO_DIR || path.resolve(__dirname, "..", "audio");
    for (const f of flagged) {
      const s = await Song.findById(f.id);
      try { fs.unlinkSync(path.join(AUDIO_DIR, s.audioFile)); } catch (e) {}
      await s.deleteOne();
    }
    console.log(`deleted ${flagged.length} rows (rerun the import to fetch them again)`);
  }
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
