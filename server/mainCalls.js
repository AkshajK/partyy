const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
const { useReducer } = require("react");

/*
message
Input (req.body): {text: String}
Precondition: 
Socket: "message", Message (emitted to room "Room: roomId")
Returns: 
Description: Adds message to database if it is from lobby. Emits socket with message
*/
message = (req, res) => {
  User.findById(req.user._id).then((user) => {
    const msg = new Message({
      sender: req.user._id,
      roomId: user.roomId,
      message: req.body.text,
    });
    socket
      .getSocketFromUserID(req.user._id)
      .to("Room: " + user.roomId)
      .emit("message", msg);
    if (user.roomId === "Lobby") msg.save();
    res.send({});
  });
};

/*
getLeaderboard
Input (req.body): 
Precondition: 
Socket: 
Returns: {"categoryId": {topScores: [], topRatings: []}}
Description: Returns a leaderboard of top scores and ratings for each category, already sorted
*/
getLeaderboard = (req, res) => {
  User.find({}, (err, users) => {
    Category.find({}, (err, categories) => {
      var leaderboard = {};
      for (var j = 0; j < categories.length; j++) {
        leaderboard[categories[i]._id] = {
          topScores: [],
          topRatings: [],
        };
      }
      for (var i = 0; i < users.length; i++) {
        let topScores = [];
        let topRatings = [];
        let leaderboardData = users[i].leaderboardData;
        for (var j = 0; j < categories.length; j++) {
          leaderboard[leaderboardData[j].categoryId].topScores.push({
            userId: users[i]._id,
            score: leaderboardData[j].highScore,
          });
          leaderboard[leaderboardData[j].categoryId].topRatings.push({
            userId: users[i]._id,
            rating: leaderboardData[j].rating,
          });
        }
      }
      for (var j = 0; j < categories.length; j++) {
        leaderboard[categories[i]._id].topScores.sort((a, b) => {
          return b.score - a.score;
        });
        leaderboard[categories[i]._id].topRatings.sort((a, b) => {
          return b.rating - a.rating;
        });
      }
      res.send(leaderboard);
    });
  });
};

/*
joinLobby
Input (req.body): 
Precondition: 
Socket: "joinedLobby", {userId: String, userName: String, leaderboardData: []}
Returns: {users: [{userId: String, userName: String, leaderboardData: []}], rooms: [Room], messages: [Messages]}
Description: Adds message to database if it is from lobby. Emits socket with message
*/
joinLobby = (req, res) => {
  Room.find({}, (err, rooms) => {
    Message.find({}, (err, messages) => {
      User.find({ roomId: "Lobby" }, (err, users) => {
        User.findById(req.user._id).then((me) => {
          socket.getSocketFromUserID(req.user._id).join("Room: Lobby");
          socket.getSocketFromUserID(req.user._id).to("Room: Lobby").emit("joinedLobby", {
            userId: me._id,
            userName: me.name,
            leaderboardData: me.leaderboardData,
          });
          res.send({
            users: users.map((user) => {
              return {
                userId: user._id,
                userName: user.name,
                leaderboardData: user.leaderboardData,
              };
            }),
            rooms: rooms,
            messages: messages
              .sort((a, b) => {
                b.timestamp - a.timestamp;
              })
              .filter((i, msg) => {
                return i < 100;
              }),
          });
        });
      });
    });
  });
};

module.exports = {
  message,
  getLeaderboard,
  joinLobby,
};
