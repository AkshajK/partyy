const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  roomId: String,
  winner: String, // userId

  song: Object,
  songHistory: [Object], // song Ids (including song)
  status: {
    type: String, // "RoundStarting" or "RoundInProgress" or "RoundFinished",
    default: "RoundStarting",
  },
  roundNumber: {
    type: Number,
    default: 1,
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  usersAlreadyAnswered: {
    type: [{
      userId: String,
      userName: String,
      time: Number,
      score: Number
    }],
    default: []
  }
  ,
  originalLength: {
    type: Number,
    default: 0
  },

  players: [
    {
      userId: String,
      score: { type: Number, default: 0 },
      rated: { type: Boolean, default: true },
     
    },
  ], // rated is if they were in at the start of the game

  statusChangeTime: Date, // if status is "RoundStarting", then this is start time; otherwise, it is end time of the 30 sec
});

// compile model from schema
module.exports = mongoose.model("game", GameSchema);
