const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const mainCalls = require("./mainCalls");
const roomCalls = require("./roomCalls");
const gameCalls = require("./gameCalls");
const socket = require("./server-socket");

initializeBots = () => {
User.find({bot: true}, (err, users)=> {
  users.forEach((user)=> {
    socket.addUser(user, socket.getIo())
  })
})
}

botJoinRoom = (req,res)=>{
  if(!req.user.isSiteAdmin) return;
  roomCalls.joinRoom({body: {name: req.body.name}, user: {_id: req.body.botId, bot: true}}, res)
}

botLeaveRoom = (req,res)=>{
  if(!req.user.isSiteAdmin) return;
  roomCalls.leaveRoom({body: {roomId: req.body.roomId}, user: {_id: req.body.botId, bot: true}}, res)
}

addBot = (req,res)=>{
  if(!req.user.isSiteAdmin) return;
  const newUser = new User({
    name: req.body.name,
    cookieToken: "",
    bot: true,
    difficulty: req.body.difficulty
  });

  newUser.save().then((saved) => {
    socket.addUser(saved, socket.getIo())
    res.send({});
  });
}

deleteBot = (req,res)=>{
  if(!req.user.isSiteAdmin) return;
  User.findByIdAndRemove(req.body.botId).then(() => {
    res.send({});
    socket.removeUser({_id: req.body.botId, bot: true}, "");
  })
}


joinBotDashboard = (req, res) => {
  if(!req.user.isSiteAdmin) return;
  User.find({bot: true}, (err, users) => {
    Room.find({$or: [{created: {$gte: new Date(new Date().getTime() - 1000*60*60*12)}}, { users: {$ne: []} }]}, (err, rooms) => {
      res.send({bots: users, rooms: rooms});
    })
  })
}

module.exports = {
  botJoinRoom,
  botLeaveRoom,
  addBot,
  deleteBot,
  joinBotDashboard,
  initializeBots
};
