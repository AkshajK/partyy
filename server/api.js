/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
// import authentication library
const auth = require("./auth");
const mainCalls = require("./mainCalls");
const roomCalls = require("./roomCalls");
const gameCalls = require("./gameCalls");
const categoryDashboardCalls = require("./categoryDashboardCalls");
// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socket = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user) socket.addUser(req.user, socket.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|
router.post("/message", auth.ensureLoggedIn, mainCalls.message);
router.post("/getLeaderboard", auth.ensureLoggedIn, mainCalls.getLeaderboard);
router.post("/joinLobby", auth.ensureLoggedIn, mainCalls.joinLobby);
router.post("/leaveLobby", auth.ensureLoggedIn, mainCalls.leaveLobby);
router.post("/changeName", auth.ensureLoggedIn, mainCalls.changeName);
router.post("/reportSong", auth.ensureLoggedIn, mainCalls.reportSong);
router.post("/createRoom", auth.ensureLoggedIn, roomCalls.createRoom);
router.post("/joinRoom", auth.ensureLoggedIn, roomCalls.joinRoom);
router.post("/leaveRoom", auth.ensureLoggedIn, roomCalls.leaveRoom);

router.post("/startGame", auth.ensureLoggedIn, gameCalls.startGame);
router.post("/guessAnswer", auth.ensureLoggedIn, gameCalls.guessAnswer);

router.post("/getCategoryAndSongData", auth.ensureLoggedIn, categoryDashboardCalls.getCategoryAndSongData);
router.get("/addCategory", auth.ensureLoggedIn, categoryDashboardCalls.addCategory);
router.post("/addCategoryAuthenticate", auth.ensureLoggedIn, categoryDashboardCalls.addCategoryAuthenticate);
router.post("/deleteCategory", auth.ensureLoggedIn, categoryDashboardCalls.deleteCategory);


// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
