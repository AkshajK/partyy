const mongoose = require("mongoose");

// One row per admin import run. The ingest worker updates it as it goes so the
// admin page can poll progress.
const ImportJobSchema = new mongoose.Schema({
  categoryName: String,
  categoryId: String,
  input: String, // raw text the admin pasted (playlist URL or title/artist lines)
  status: {
    type: String, // "queued" | "running" | "done" | "failed"
    default: "queued",
  },
  total: { type: Number, default: 0 },
  done: { type: Number, default: 0 }, // songs successfully added
  skipped: { type: Number, default: 0 }, // already in category
  failed: { type: [{ title: String, artist: String, reason: String }], default: [] },
  log: { type: [String], default: [] },
  error: String,
  created: { type: Date, default: Date.now },
  finished: Date,
});

module.exports = mongoose.model("importjob", ImportJobSchema);
