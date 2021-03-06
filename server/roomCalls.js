const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");


const lock = require("./lock").lock;


/*
createRoom
Input (req.body): {private: Boolean, 
categoryId: String, 
rated: Boolean}
Precondition: categoryId is a valid category id
Socket: to("Room: Lobby").emit(“createdRoom”, Room) 
Returns: {name: String}  (the room name, some randomly generated string) 
Description: Creates a room
*/
createRoom = (req, res) => {
  let mySocket = socket.getSocketFromUserID(req.user._id);
  if(!mySocket) {
    res.send({disconnect: true});
    return;
  }
  let name = Math.random().toString(36).substring(2, 15);
  User.findById(req.user._id).then((me) => {
    Category.findById(req.body.categoryId).then((category) => {
      if (!category) res.send({});
      const newRoom = new Room({
        name: name,
        category: category,
        rated: req.body.rated,
        private: req.body.private,
        host: {
          userId: req.user._id,
          name: me.name,
        },
      });
      newRoom.save().then((room) => {
         if(!room.private)
            mySocket.to("Room: Lobby").emit("room", room);

        res.send({ name: name });
      });
    });
  });
};

/*
joinRoom
Input (req.body): {name: String}
Precondition: name is name of a valid room, 
Socket: to("Room: roomId").emit(“joinedRoom”, {userId: String, userName: String, leaderboardData: []})
Returns:  {room: Room, game: Game, users: [{userId: String, userName: String, leaderboardData: []}]}
Description: Checks to see if room name exists and is not closed. If it is closed, shows error message. Else, returns information associated with the room and game
*/
joinRoom = (req, res) => {
  if(!req.user || !req.user._id) {
    res.send({exists: false});
    return;
  }
  lock.acquire("room"+req.body.name, function(done) {
  Room.findOne({ name: req.body.name }).then((room) => {
    if (!room) {
      res.send({ exists: false });
      done({}, {})
    }
    else {
      Game.findOne(room.gameId !== "Waiting" ? { _id: room.gameId } : { doesntxist: "nope" }).then(
        (game) => {
          User.findById(req.user._id).then((me) => {
            me.roomId = room._id;
            me.save().then(() => {
              User.find({ roomId: room._id }, (err, users) => {
                Category.findById(room.category._id).then((category) => {
                  if(!req.user.bot) {
                    if(!socket.getSocketFromUserID(req.user._id)) {
                      res.send({exists: false});
                      done({}, {})
                      return;
                    }
                    socket.getSocketFromUserID(req.user._id).join("Room: " + room._id);
                  }

                  
                  (socket
                    .getSocketFromUserID(req.user._id) || socket.getIo())
                    .to("Room: " + room._id)
                    .emit("joinRoom", {
                      userId: me._id,
                      userName: me.name,
                      leaderboardData: me.leaderboardData,
                    });
                  
                  let roomUsers = room.users.filter((user)=>{return socket.getSocketFromUserID(user)});
                  if(!roomUsers.includes(req.user._id))
                      roomUsers.push(req.user._id); 
                  room.users = roomUsers;
                  room.save().then((savedRoom) => {
                    if (savedRoom.users.length !== users.length) {
                      console.log("ERROR: USERS DIFFER " + savedRoom.users.length + " " + users.length);
                      users.forEach((o)=>{
                        if(!savedRoom.users.includes(o._id+"")) {
                          User.findById(o._id).then((u)=>{
                            u.roomId = "Offline"
                            u.save().then(()=>{
                              console.log("Set " + o._id + " to Inactive");
                            });
                          })
                        }
                      })
                     // console.log(savedRoom.users);
                     // console.log(users);
                    }
                    if(!savedRoom.private) {
                    (socket
                    .getSocketFromUserID(req.user._id) || socket.getIo())
                    .to("Room: Lobby")
                    .emit("room", savedRoom)
                    }
                    res.send({
                      exists: true,
                      room: savedRoom,
                      game: game,
                      users: users.filter((user)=>{return user.bot || socket.getSocketFromUserID(user._id)}).map((user) => {
                        return {
                          userId: user._id,
                          userName: user.name,
                          leaderboardData: user.leaderboardData,
                        };
                      }),
                      category: category,
                    });
                    done({}, {});
                  });
                });
              });
            });
          });
        }
      );
    }
  });
  }, function(err, ret){});
};

/*
leaveRoom
Input (req.body): {roomId: String}
Precondition: roomId is a valid room
Socket: to("Room: roomId").emit(“leftRoom”, {userId: String})
Returns: {}  
Description: Does socket.leave("Room: roomId")
*/
leaveRoom = (req, res) => {
  let mySocket = socket.getSocketFromUserID(req.user._id);
  if(!req.user.bot && !mySocket) {
    res.send({});
    return;
  }
  lock.acquire("room"+req.body.name, function(done) {
  (mySocket || socket.getIo())
    .to("Room: " + req.body.roomId)
    .emit("leftRoom", {
      userId: req.user._id,
    });
    /*
    socket
    .getSocketFromUserID(req.user._id)
    .to("Room: " + "Lobby")
    .emit("leftRoomLobby", {
      userId: req.user._id,
      roomId: req.body.roomId
    });*/
  
  Room.findById(req.body.roomId).then((room) => {
    let users = room.users.filter((id) => {
      return id !== req.user._id+"";
    });
    room.users = users;
    
    
    room.save().then((savedRoom) => {
      
      if(!savedRoom.private) {
      (mySocket || socket.getIo())
    .to("Room: " + "Lobby")
    .emit("room", savedRoom);
      }
      if(!req.user.bot) mySocket.leave("Room: " + req.body.roomId);
      User.findById(req.user._id).then((user)=>{
        user.roomId = "Offline"
        user.save().then(()=>{
          res.send({});
          done({}, {});
        })
      })
      
    });
  });
}, function(err, ret) {});
};

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  
};
