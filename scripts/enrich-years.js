#!/usr/bin/env node
// Fill Song.releaseYear from iTunes for songs that lack it. Variants (remaster,
// live) are allowed here since we only want the year of the recording found.
//   DATABASE_NAME=partyy node scripts/enrich-years.js
require("dotenv").config();
const mongoose = require("mongoose");
const Song = require("../server/models/song");
const { getJson } = require("../server/ingest/http");
const { norm, cleanTitle } = require("../server/ingest/metadata");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const words = (s) => new Set(norm(s).split(" ").filter(Boolean));

// iTunes allows roughly 20 searches a minute; back off hard on 429.
async function searchSlow(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      return (await getJson(url)).results || [];
    } catch (e) {
      if (!/429/.test(e.message)) throw e;
      await sleep(20000 * (attempt + 1));
    }
  }
  throw new Error("rate limited too long");
}

async function yearFor(title, artist) {
  const ct = cleanTitle(title);
  const url = "https://itunes.apple.com/search?media=music&entity=song&limit=25&term=" + encodeURIComponent(ct + " " + artist);
  const rs = await searchSlow(url);
  const tw = words(ct), aw = [...words(artist)].filter((w) => w.length > 1);
  let best = null, bestYear = Infinity;
  for (const r of rs) {
    const rt = words(r.trackName), ra = norm(r.artistName).split(" ");
    const titleOk = [...tw].filter((w) => rt.has(w)).length / Math.max(tw.size, 1) >= 0.6;
    const artistOk = !aw.length || aw.some((w) => ra.includes(w));
    if (!titleOk || !artistOk || !r.releaseDate) continue;
    const y = parseInt(r.releaseDate.slice(0, 4), 10);
    if (y < bestYear) { bestYear = y; best = r; } // earliest release = original
  }
  return best ? bestYear : undefined;
}

async function main() {
  await mongoose.connect(process.env.ATLAS_SRV, { useNewUrlParser: true, useUnifiedTopology: true, dbName: process.env.DATABASE_NAME });
  const songs = await Song.find({ releaseYear: { $exists: false } });
  console.log("songs without year:", songs.length);
  let done = 0, miss = 0;
  for (const s of songs) {
    try {
      const y = await yearFor(s.title, (s.artist || [])[0] || "");
      if (y) { await Song.updateOne({ _id: s._id }, { $set: { releaseYear: y } }); done++; } else miss++;
    } catch (e) { miss++; console.log("err", s.title, e.message); await sleep(3000); }
    if ((done + miss) % 50 === 0) console.log(`progress ${done + miss}/${songs.length} (found ${done}, missing ${miss})`);
    await sleep(3200);
  }
  console.log(`done: found ${done}, missing ${miss}`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
