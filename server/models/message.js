const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: String,
  roomId: String,
  timestamp: { type: Date, default: Date.now },
  message: String,
  style: { type: String, default: "message" }, // for correct answer green message, for joining and leaving room, and for regular chats
});

// compile model from schema
module.exports = mongoose.model("message", MessageSchema);
