const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: String,
  playlistId: String,
  isDefault: { type: Boolean, default: false }, // shown first in the lobby dropdown
  order: { type: Number, default: 100 }, // lobby dropdown order after the default; ties by name
});

// compile model from schema
module.exports = mongoose.model("category", CategorySchema);
