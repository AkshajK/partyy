// Admin: queue a song import and watch its progress.
// INGEST_MODE=local runs the downloader as a child of this server (dev Macs).
// INGEST_MODE=remote leaves the job "queued" for scripts/ingest-worker.js,
// which runs on a machine YouTube doesn't block (the droplet is blocked).
const path = require("path");
const { spawn } = require("child_process");
const ImportJob = require("./models/importJob");

const MODE = process.env.INGEST_MODE || "local";

const importSongs = async (req, res) => {
  if (!req.user.isSiteAdmin) return res.status(403).send({ msg: "admin only" });
  const input = (req.body.input || "").trim();
  const categoryName = (req.body.categoryName || "").trim();
  if (!input) return res.status(400).send({ msg: "paste a playlist link or a list of songs" });
  const job = await new ImportJob({ categoryName, input }).save();
  if (MODE === "local") {
    const child = spawn(process.execPath, [path.resolve(__dirname, "..", "scripts", "ingest.js"), "--job", job._id + ""], {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", (e) => console.log("ingest child failed to start:", e.message));
  }
  res.send({ jobId: job._id, mode: MODE });
};

const importJobs = async (req, res) => {
  if (!req.user.isSiteAdmin) return res.status(403).send({ msg: "admin only" });
  const jobs = await ImportJob.find({}).sort({ created: -1 }).limit(10);
  res.send(
    jobs.map((j) => ({
      _id: j._id,
      categoryName: j.categoryName,
      status: j.status,
      total: j.total,
      done: j.done,
      skipped: j.skipped,
      failed: j.failed,
      error: j.error,
      created: j.created,
      finished: j.finished,
      log: j.log.slice(-8),
      input: j.input.slice(0, 80),
    }))
  );
};

module.exports = { importSongs, importJobs };
