#!/usr/bin/env node
// Run an import from the command line (used for bulk loads and by the server,
// which spawns this as a child process so downloads never block the game).
//
//   node scripts/ingest.js --job <importJobId>
//   node scripts/ingest.js --category "General" --file songs.txt
//   node scripts/ingest.js --category "Classics" --input "<playlist url>"
require("dotenv").config();
const fs = require("fs");
const mongoose = require("mongoose");
const ImportJob = require("../server/models/importJob");
const { runImport } = require("../server/ingest/run");

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf("--" + name);
  return i === -1 ? undefined : args[i + 1];
};

async function main() {
  // Atlas drops idle TLS sockets now and then; without a handler the whole
  // multi-hour import dies on one ECONNRESET. Mongoose reconnects on its own.
  mongoose.connection.on("error", (e) => console.error("mongo connection error:", e.message));
  await mongoose.connect(process.env.ATLAS_SRV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: process.env.DATABASE_NAME,
  });
  let jobId = opt("job");
  if (!jobId) {
    const input = opt("file") ? fs.readFileSync(opt("file"), "utf8") : opt("input");
    if (!input) throw new Error("need --job, or --category with --file/--input");
    const job = await new ImportJob({ categoryName: opt("category"), input, status: "running" }).save(); // "running" so a polling worker does not grab it too
    jobId = job._id + "";
    console.log("created job", jobId);
  }
  const job = await runImport(jobId);
  console.log(`status=${job.status} total=${job.total} added=${job.done} skipped=${job.skipped} failed=${job.failed.length}` + (job.error ? " error=" + job.error : ""));
  job.failed.forEach((f) => console.log("  failed:", f.title, "-", f.artist, "->", f.reason));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
