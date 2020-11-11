let io;

const userToSocketMap = {}; // maps user ID to socket object
const socketToUserMap = {}; // maps socket ID to user object
const User = require("./models/user");
const Room = require("./models/room");
const lock = require("./lock").lock;
const getSocketFromUserID = (userid) => userToSocketMap[userid];
const getUserFromSocketID = (socketid) => socketToUserMap[socketid];
const getSocketFromSocketID = (socketid) => io.sockets.connected[socketid];
const redis = require('socket.io-redis');
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
  //console.log("addedUser " + user._id + " " + socket.id);
};

const removeUser = (user, socket, server) => {
  if (user && !server) delete userToSocketMap[user._id];
  if(!user || (user && !user.bot)) delete socketToUserMap[socket.id];
 // console.log("remove user")
};

module.exports = {
  init: (http) => {
    io = require("socket.io")(http);
    io.adapter(redis({ host: 'localhost', port: 6379 }));


    io.on("connection", (socket) => {
      console.log(`socket has connected ${socket.id}`);
      socket.on("disconnect", (reason) => {
        
        const user = getUserFromSocketID(socket.id);
        
        if (user) {
          User.findById(user._id).then((me) => {
            if (me.roomId === "Lobby") {
              me.roomId="Offline"
              me.save().then(() => {
                removeUser(user, socket, reason === "server namespace disconnect");
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
                lock.acquire("room"+room.name, async function(done) {
                 room = await Room.findById(me.roomId); 
                let users = room.users.filter((id) => {
                  return id !== me._id+"";
                });
                room.users = users;
                
                room.save().then((savedRoom)=>{
                  if(!savedRoom.private) 
                    io.in("Room: Lobby").emit("room", savedRoom);
                  me.roomId="Offline"
                  me.save().then(() => {
                    removeUser(user, socket, reason === "server namespace disconnect");
                    done({}, {});
                  })
                  
                });
                }, function(err, ret) {});
              });
              
            }
           
          });
        }
        else removeUser(user, socket, reason === "server namespace disconnect");
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
