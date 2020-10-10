const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
const gameCalls = require("./gameCalls");
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
      timestamp: new Date(),
      style: "message"
    });
 
    if(user.roomId !== "Lobby") {
      Room.findById(user.roomId).then((room)=>{
        if(room.gameId !== "Waiting") {
          Game.findById(room.gameId).then((game) => {
            if(game.status === "RoundInProgress") {
              gameCalls.guessAnswer(req.user._id+"",user.name, game._id, msg)
              
            }
            else {
              socket.getIo()
      
      .in("Room: " + user.roomId)
      .emit("message", msg);
            }
          })
        }
        else {
          socket.getIo()
      
      .in("Room: " + user.roomId)
      .emit("message", msg);
        }
      })
    }
    else {
      socket.getIo()
      
      .in("Room: " + user.roomId)
      .emit("message", msg);
    }
    
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

  gameCalls.getLeaderboard().then((data) => {
    res.send(data);
  })
  
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
  
  Room.find({created: {$gte: new Date(new Date().getTime() - 1000*60*60*12)}}, (err, rooms) => {
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
  
            console.log(req.user._id)
            res.send({
              users: users.filter((user)=>{return socket.getSocketFromUserID(user._id)}).map((user) => {
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

reportSong = (req, res) => {
  Song.findOne({songUrl: req.body.songUrl}).then((song) => {
    song.bad = true;
    song.save().then(()=>{
      res.send({reported: true})
    });
  })
}

changeName = (req, res) => {
  User.findById(req.user._id).then((user)=>{
    user.name = req.body.name 
    if(user.name.length > 20) return;
    user.save().then(() => {
      socket.getIo().in("Room: " + req.user.roomId).emit("changeName", {
        userId: req.user._id,
        userName: user.name,
        userLeaderboardData: user.leaderboardData
      })
      res.send({})
    })
   
  })
  
}
module.exports = {
  message,
  getLeaderboard,
  joinLobby,
  reportSong,
  leaveLobby,
  changeName
};
