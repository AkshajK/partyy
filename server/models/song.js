const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  title: String,
  artist: [String],
  artUrl: String,
  songUrl: String,
  categoryId: String,
  spotifyUrl: String,
  bad: {
    type: Boolean,
    default: false
  }
});

// compile model from schema
module.exports = mongoose.model("song", SongSchema);
