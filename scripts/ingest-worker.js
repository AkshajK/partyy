#!/usr/bin/env node
// Runs on a machine YouTube doesn't block (Kevin's Mac). Polls Mongo for queued
// import jobs, downloads the audio locally, syncs the MP3s to the game server,
// then marks the job done. Start it under launchd (see scripts/launchd/).
//
//   AUDIO_DIR=~/PartyyAudio SYNC_TARGET=root@host:/opt/partyy/audio/ node scripts/ingest-worker.js
require("dotenv").config();
const { execFileSync } = require("child_process");
const mongoose = require("mongoose");
const ImportJob = require("../server/models/importJob");
const { runImport, AUDIO_DIR } = require("../server/ingest/run");

const SYNC_TARGET = process.env.SYNC_TARGET; // e.g. root@159.203.120.222:/opt/partyy/audio/
const POLL_MS = parseInt(process.env.POLL_MS || "20000", 10);

function sync() {
  if (!SYNC_TARGET) return;
  execFileSync("rsync", ["-az", "--ignore-existing", AUDIO_DIR.replace(/\/?$/, "/"), SYNC_TARGET], { stdio: "inherit", timeout: 30 * 60 * 1000 });
}

async function tick() {
  const job = await ImportJob.findOneAndUpdate(
    { status: "queued" },
    { status: "running", $push: { log: new Date().toISOString().slice(11, 19) + " picked up by ingest worker" } },
    { sort: { created: 1 }, new: true }
  );
  if (!job) return false;
  console.log(new Date().toISOString(), "running job", job._id + "", job.categoryName || "");
  const done = await runImport(job._id + "", {
    beforeDone: async () => {
      console.log("syncing audio to", SYNC_TARGET);
      sync();
    },
  });
  console.log(`job ${done._id} ${done.status}: added=${done.done} skipped=${done.skipped} failed=${done.failed.length}`);
  return true;
}

async function main() {
  await mongoose.connect(process.env.ATLAS_SRV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DATABASE_NAME,
  });
  console.log("ingest worker up. db=" + process.env.DATABASE_NAME + " audio=" + AUDIO_DIR + " sync=" + (SYNC_TARGET || "(none)"));
  for (;;) {
    try {
      while (await tick()) {}
    } catch (e) {
      console.error("worker error:", e.message);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
