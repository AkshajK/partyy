#!/usr/bin/env node
// Runs on a machine YouTube doesn't block (Kevin's Mac). Polls Mongo for queued
// import jobs, downloads the audio locally, syncs the MP3s to the game server,
// then marks the job done. Start it under launchd (see scripts/launchd/).
//
//   AUDIO_DIR=~/PartyyAudio SYNC_TARGET=root@host:/opt/partyy/audio/ node scripts/ingest-worker.js
require("dotenv").config();
const mongoose = require("mongoose");
const ImportJob = require("../server/models/importJob");
const { runImport, AUDIO_DIR } = require("../server/ingest/run");

const SYNC_TARGET = process.env.SYNC_TARGET; // e.g. root@159.203.120.222:/opt/partyy/audio/ (rsync happens inside runImport)
const POLL_MS = parseInt(process.env.POLL_MS || "20000", 10);

async function tick() {
  const job = await ImportJob.findOneAndUpdate(
    { status: "queued" },
    { status: "running", $push: { log: new Date().toISOString().slice(11, 19) + " picked up by ingest worker" } },
    { sort: { created: 1 }, new: true }
  );
  if (!job) return false;
  console.log(new Date().toISOString(), "running job", job._id + "", job.categoryName || "");
  const done = await runImport(job._id + "");
  console.log(`job ${done._id} ${done.status}: added=${done.done} skipped=${done.skipped} failed=${done.failed.length}`);
  return true;
}

async function main() {
  // Atlas drops idle TLS sockets now and then; without a handler the whole
  // multi-hour import dies on one ECONNRESET. Mongoose reconnects on its own.
  mongoose.connection.on("error", (e) => console.error("mongo connection error:", e.message));
  // The mongodb 3.x driver emits idle-socket resets on its internal Connection,
  // which mongoose does not forward; they would otherwise kill the process.
  process.on("uncaughtException", (e) => {
    if (e && (e.name === "MongoNetworkError" || e.code === "ECONNRESET")) return console.error("mongo socket reset (driver reconnects):", e.message);
    throw e;
  });
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
