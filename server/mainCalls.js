const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");

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
      sender: {userId: req.user._id, name: user.name},
      roomId: user.roomId,
      message: req.body.text,
    });
    socket.getIo()
      
      .in("Room: " + user.roomId)
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
Returns: {leaderboard: {"categoryId": {topScores: [], topRatings: []}}, categories: [Category]}
Description: Returns a leaderboard of top scores and ratings for each category, already sorted, and also all the categories
*/
getLeaderboard = (req, res) => {
  /*
  const category = new Category({name: "General"});
  category.save()
  const category2 = new Category({name: "General 2"});
  category2.save()
  */
  User.find({}, (err, users) => {
    Category.find({}, (err, categories) => {
      console.log(categories);
      var leaderboard = {};
      for (var j = 0; j < categories.length; j++) {
        leaderboard[categories[j]._id] = {
          topScores: [],
          topRatings: [],
        };
      }
      for (var i = 0; i < users.length; i++) {
        let topScores = [];
        let topRatings = [];
        let leaderboardData = users[i].leaderboardData;
        for (var j = 0; j < leaderboardData.length; j++) {
          leaderboard[leaderboardData[j].categoryId].topScores.push({
            userId: users[i]._id,
            name: users[i].name,
            score: leaderboardData[j].highScore,
          });
          leaderboard[leaderboardData[j].categoryId].topRatings.push({
            userId: users[i]._id,
            name: users[i].name,
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
      res.send({ leaderboard: leaderboard, categories: categories });
    });
  });
};

/*
joinLobby
Input (req.body): 
Precondition: 
Socket: to("Room: Lobby").emit("joinedLobby", {userId: String, userName: String, leaderboardData: []})
Returns: {users: [{userId: String, userName: String, leaderboardData: []}], rooms: [Room], messages: [Messages]}
Description: Adds message to database if it is from lobby. Emits socket with message
*/
joinLobby = (req, res) => {
  Room.find({}, (err, rooms) => {
    Message.find({}, (err, messages) => {
      User.findById(req.user._id).then((me) => {
        me.roomId = "Lobby";
        me.save().then(() => {
          User.find({ roomId: "Lobby" }, (err, users) => {
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
                .filter((msg, i) => {
                  return i < 100;
                }),
            });
          });
        });
      });
    });
  });
};

leaveLobby = (req, res) => {
  socket.getSocketFromUserID(req.user._id).to("Room: Lobby").emit("leftLobby", {
    userId: req.user._id,
  });
  socket.getSocketFromUserID(req.user._id).leave("Room: Lobby");
  res.send({});
};

module.exports = {
  message,
  getLeaderboard,
  joinLobby,
  leaveLobby,
};
