const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  name: String, // randomly generated and is part of URL
  categoryId: String,
  rated: {
    type: Boolean,
    default: false,
  },
  host: String, // userId
  gameId: {
    type: String,
    default: "Waiting",
  },
  status: {
    type: String, // "Waiting" or "InProgress" or "Finished"
    default: "Waiting"
  },
  created: { type: Date, default: Date.now },
  closed: {
    type: Boolean, 
    default: false
  },
  private: {
    type: Boolean,
    default: false
  }
});

// compile model from schema
module.exports = mongoose.model("room", RoomSchema);
