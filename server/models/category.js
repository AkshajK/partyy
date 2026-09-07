const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: String,
  playlistId: String,
  isDefault: { type: Boolean, default: false }, // shown first in the lobby dropdown
});

// compile model from schema
module.exports = mongoose.model("category", CategorySchema);
