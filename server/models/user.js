const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  cookieToken: String,
  isSiteAdmin: {
    type: Boolean,
    default: false,
  },
  roomId: {
    type: String, // "Lobby" for lobby, "Offline" for offline
    default: "Offline",
  },
  leaderboardData: {
    type: [
      {
        categoryId: String,
        rating: Number,
        highScore: Number,
      },
    ],
    default: [],
  },
  darkMode: {
    type: Boolean,
    default: true,
  },
  bot: {
    type: Boolean,
    default: false
  },
  difficulty: {
    type: Number,
    default: 0
  }
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
