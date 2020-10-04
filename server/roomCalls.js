const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");

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
  let name = Math.random().toString(36).substring(2, 15)
  Category.findById(req.body.categoryId).then((category) => {
    if(!category) res.send({})
    const newRoom = new Room({
      name: name,
      categoryId: req.body.categoryId,
      rated: req.body.rated,
      private: req.body.private,
      host: req.user._id,
    })
    newRoom.save().then(() => {
      socket.getSocketFromUserID(req.user._id).to("Room: Lobby").emit("createdRoom", newRoom);
      res.send({name: name})
    })
  })
  
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
  Room.findOne({name: req.body.name}).then((room) => {
    if(!room) res.send({exists: false})
    else {
      Game.findById(room.gameId).then((game) => {
        User.find({roomId: room._id}, (err, users) => {
          User.findById(req.user._id).then((me) => {
            Category.findById(room.categoryId).then((category) => {
              me.roomId = room._id
              me.save().then(() => {
                socket.getSocketFromUserID(req.user._id).join("Room: "+room._id);
                let listOfIds = room.allUserIdsThatHaveBeenInRoom
                listOfIds.push(req.user._id)
                room.allUserIdsThatHaveBeenInRoom = listOfIds
                room.save().then((savedRoom) => {
                  res.send({
                    exists: true,
                    room: savedRoom,
                    game: game,
                    users: users.map((user) => {
                      return {
                        userId: user._id,
                        userName: user.name,
                        leaderboardData: user.leaderboardData,
                      };
                    }),
                    category: category
                  })
                })
                
                
              })
            })
            
          })
          
        })
      })
    }
  })
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
  
  socket.getSocketFromUserID(req.user._id).to("Room: "+req.body.roomId).emit("leftRoom", {
    userId: req.user._id,
  });
  socket.getSocketFromUserID(req.user._id).leave("Room: "+req.body.roomId);
  res.send({})
};


module.exports = {
  createRoom,
  joinRoom,
  leaveRoom
};
