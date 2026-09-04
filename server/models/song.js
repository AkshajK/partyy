const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  title: String,
  artist: [String],
  artUrl: String,
  songUrl: String, // legacy: Spotify 30-second preview MP3 (fixed clip)
  categoryId: String,
  spotifyUrl: String,
  bad: {
    type: Boolean,
    default: false
  },
  // Self-hosted full-length audio (added 2026-09). When audioFile is set the
  // game streams a random 30-second window of it instead of songUrl.
  audioFile: String, // filename inside AUDIO_DIR, e.g. "<songId>.mp3"
  duration: Number, // seconds, from ffprobe
  youtubeId: String,
  source: String, // "spotify-preview" | "youtube"
});

// compile model from schema
module.exports = mongoose.model("song", SongSchema);
