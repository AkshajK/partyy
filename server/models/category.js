const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name: String,
  playlistId: String,
  
});

// compile model from schema
module.exports = mongoose.model("category", CategorySchema);
