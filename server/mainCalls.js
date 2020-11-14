const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
const gameCalls = require("./gameCalls");
var Filter = require('bad-words');
var filter = new Filter();
filter.removeWords('god');
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
    if(user.roomId === "Offline") {
      res.send({error: true});
      return;
    }
    res.send({});
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
          Game.findById(room.gameId).then(async (game) => {
            if(game.status === "RoundInProgress") {
              await gameCalls.guessAnswer(req.user._id+"",user.name, game._id, msg, false)
              
            }
            else {
              msg.message = filter.clean(msg.message);
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
  gameCalls.getLeaderboard(true, undefined).then((data) => {
    res.send(data);
  })
};

require("dotenv").config();
/*
joinLobby
Input (req.body): 
Precondition: 
Socket: to("Room: Lobby").emit("joinedLobby", {userId: String, userName: String, leaderboardData: []})
Returns: {users: [{userId: String, userName: String, leaderboardData: []}], rooms: [Room], messages: [Messages]}
Description: Adds message to database if it is from lobby. Emits socket with message
*/
joinLobby = (req, res) => {
  if(!req.user || !req.user._id) {
    res.send({disconnect: true});
    return;
  }
  Room.find({private: false, $or: [{created: {$gte: new Date(new Date().getTime() - 1000*60*60*(process.env.HOURS || 12))}}, { users: {$ne: []} }]}, (err, rooms) => {
    Message.find({timestamp: {$gte: new Date(new Date().getTime() - 3000*60*60*(process.env.HOURS || 12))}}, (err, messages) => {
      User.findById(req.user._id).then((me) => {
        me.roomId = "Lobby";
        me.save().then(() => {
            let mySocket = socket.getSocketFromUserID(req.user._id);
            if(!mySocket) {
              res.send({disconnect: true});
              return;
            }
            mySocket.join("Room: Lobby");  
            console.log(req.user.name + " joined the Lobby")
            res.send({
              rooms: rooms,
              messages: messages
                .sort((a, b) => {
                  a.timestamp - b.timestamp;
                })
                .filter((msg, i) => {
                  return i >= messages.length - 100;
                }),
            });

        });
      });
    });
  });
};

leaveLobby = (req, res) => {
  let mySocket = socket.getSocketFromUserID(req.user._id);
  if(!mySocket) {
    res.send({disconnect: true});
    return;
  }
  mySocket.leave("Room: Lobby");
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
  res.send({})
  User.findById(req.user._id).then((user)=>{
    user.name = filter.clean(req.body.name)
    if(user.name.length > 20) return;
    if(user.name.length < 1) return;
    user.save().then(() => {
      if(user.roomId !== "Lobby") {
      socket.getIo().in("Room: " + user.roomId).emit("changeName", {
        userId: req.user._id,
        userName: user.name,
        leaderboardData: user.leaderboardData
      })
      }
      gameCalls.getLeaderboard(false, [req.user._id]).then((data) => {
        socket.getIo().in("Room: " + user.roomId).emit("leaderboard", data)
      })
      
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
