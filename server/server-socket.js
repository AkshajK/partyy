let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object
const User = require("./models/user");
const Room = require("./models/room");
const lock = require("./lock").lock;
const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.connected[socketid];

const addUser = (user, socket) => {
  const oldSocket = userToSocketMap[user._id];
  if (oldSocket && oldSocket.id !== socket.id) {
    // there was an old tab open for this user, force it to disconnect
    // FIXME: is this the behavior you want?
    oldSocket.disconnect();
    delete socketToUserMap[oldSocket.id];
  }

  userToSocketMap[user._id] = socket;
  if(!user.bot) socketToUserMap[socket.id] = user;
};

const removeUser = (user, socket) => {
  if (user) delete userToSocketMap[user._id];
  if(user && !user.bot) delete socketToUserMap[socket.id];
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);

    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        
        const user = getUserFromSocketID(socket.id);
        
        if (user) {
          User.findById(user._id).then((me) => {
            if (me.roomId === "Lobby") {
              io.in("Room: Lobby").emit("leftLobby", {
                userId: me._id,
              });
              me.roomId="Offline"
              me.save().then(() => {
                  removeUser(user, socket);
              })
            } else if (me.roomId === "Offline") {
              
            }
            else {
              io.in("Room: " + me.roomId).emit("leftRoom", {
                userId: me._id,
              });
              /*
              io.in("Room: Lobby").emit("leftRoomLobby", {
                userId: me._id,
                roomId: me.roomId
              });*/
              
              Room.findById(me.roomId).then((room) => {
                lock.acquire("room"+room.roomId, function(done) {
                let users = room.users.filter((id) => {
                  return id !== me._id+"";
                });
                room.users = users;
                room.save().then((savedRoom)=>{
                  io.in("Room: Lobby").emit("room", savedRoom);
                  me.roomId="Offline"
                  me.save().then(() => {
                    removeUser(user, socket);
                    done({}, {});
                  })
                  
                });
                }, function(err, ret) {});
              });
              
            }
           
          });
        }
        else removeUser(user, socket);
      });
    });
  },

  addUser: addUser,
  removeUser: removeUser,

  getSocketFromUserID: getSocketFromUserID,
  getUserFromSocketID: getUserFromSocketID,
  getSocketFromSocketID: getSocketFromSocketID,
  getIo: () => io,
};
