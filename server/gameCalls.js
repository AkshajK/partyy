const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
const NUM_ROUNDS = 5;
let fromNow = (num) => {
  return new Date(new Date().getTime() + num);
};

startGame = (req, res) => {
  Song.aggregate([{ $sample: { size: 1 } }], (err, songs) => {
    //console.log(songs)
    User.findById(req.user._id).then((user) => {
      Room.findById(user.roomId).then((room) => {
        if (room.status === "InProgress") return;
        room.status = "InProgress";
        let players = room.users.map((oneuser) => {
          return { userId: oneuser };
        })
        const game = new Game({
          roomId: room._id,
          song: songs[0],
          songHistory: [],
          players: players,
          originalLength: players.length,

          statusChangeTime: fromNow(3000),
        });
        game.save().then((savedGame) => {
          room.gameId = savedGame._id;
          room.save().then((savedRoom) => {
            
              socket
              .getIo()
              .in("Room: Lobby")
              .emit("room", savedRoom);
            
            let hideAnswer = savedGame 
            hideAnswer.song = {songUrl: hideAnswer.song.songUrl}
            socket
              .getIo()
              .in("Room: " + room._id)
              .emit("game", hideAnswer);
            setTimeout(() => {
              startRound(room._id, 1, savedGame._id+"");
            }, 3000);
            res.send({})
          });
        });
      });
    });
  });
};

startRound = (roomId, roundNum, gameId) => {
  console.log("Started Round " + roundNum);
  Room.findById(roomId).then((room) => {
    //console.log(room.gameId)
    if (room.gameId === "Waiting") return;
    Game.findById(room.gameId).then((game) => {
      //console.log(game._id + " " + gameId + " " + game.status + " " + game.roundNumber + " " + (!(game._id == gameId && game.status === "RoundStarting" && game.roundNumber === roundNum)))
      
      if (!((game._id+"" === gameId) && (game.status === "RoundStarting") && (game.roundNumber === roundNum)))
        return;
      
      game.status = "RoundInProgress";
      game.statusChangeTime = fromNow(30000);
     
      game.save().then((savedGame) => {
       console.log("saved")
        socket
          .getIo()
          .in("Room: " + room._id)
          .emit("game", savedGame);
        setTimeout(() => {
          endRound(room._id, roundNum, gameId);
        }, 30000);
      });
    });
  });
};

endRound = (roomId, roundNum, gameId) => {
  console.log("Ended round" + roundNum);
  Room.findById(roomId).then((room) => {
    if (room.gameId === "Waiting") return;
    Game.findById(room.gameId).then((game) => {
      if (
        !(game._id+"" === gameId && game.status === "RoundInProgress" && game.roundNumber === roundNum)
      )
        return;
      let songHistory = game.songHistory;
      songHistory.push(game.song);
      game.songHistory = songHistory;
      Song.aggregate([{ $sample: { size: 1 } }], (err, songs) => {
        if (roundNum === NUM_ROUNDS) {
          game.status = "RoundFinished";
          room.status = "Finished"

          room.save().then((savedRoom)=>{
            socket
            .getIo()
            .in("Room: Lobby")
            .emit("room", savedRoom);
          }) // room status update in lobby
        }
        else {
          game.status = "RoundStarting";
          game.song = songs[0];
          game.statusChangeTime = fromNow(3000);
          game.usersAlreadyAnswered=[]
          game.roundNumber = game.roundNumber + 1;
          game.correctAnswers = 0
        }
        game.save().then((savedGame) => {
          let hideAnswer = savedGame 
          hideAnswer.song = {songUrl: hideAnswer.song.songUrl}
          socket
            .getIo()
            .in("Room: " + room._id)
            .emit("game", hideAnswer);
          if (roundNum !== NUM_ROUNDS) {
            setTimeout(() => {
              startRound(room._id, roundNum + 1, gameId, songs[0]);
            }, 3000);
          }
        });
      });
    });
  });
};

var stringSimilarity = require('string-similarity');

let similarity = (a, b) => {
  return stringSimilarity.compareTwoStrings(a.toLowerCase(),b.toLowerCase());
}
guessAnswer = (userId, gameId, msg) => {
  Game.findById(gameId).then((game)=>{
    let correct = false
  let messageText = msg.message
  let title = game.song.title
  if(!game.usersAlreadyAnswered.includes(userId) && (game.status==="RoundInProgress")&&((similarity(messageText, title) > 0.7) || (similarity(messageText.toLowerCase().replace("fuck", "forget"), title) > 0.7) ||
  (similarity(messageText.toLowerCase().replace(" and ", " & "), title))))
    correct = true;
  if(correct) {
    User.findById(userId).then((user)=>{
      socket.getIo()
      .in("Room: " + game.roomId)
      .emit("message", {
        roomId: game.roomId,

        message: user.name + " guessed the title!",
        style: "correct answer"
      });
    })

    let givenPoints =  Math.floor(((new Date(game.statusChangeTime)).getTime() - (new Date()).getTime()))/1000.0
    let numAnswered = game.correctAnswers
    let points = 40 + Math.floor(givenPoints) + (numAnswered === 0 ? 30 : (numAnswered === 1 ? 15 : (numAnswered === 2 ? 5 : 0)))
    game.correctAnswers = numAnswered + 1
    let usersAlreadyAnswered = game.usersAlreadyAnswered
    usersAlreadyAnswered.push(userId)
    game.usersAlreadyAnswered=usersAlreadyAnswered
    let newPlayers = game.players
    let player = newPlayers.find((p)=>{return p.userId === userId+""})
    
    if(!player) {
      newPlayers.push({
        userId: userId,
        score: points,
        rated: false
      })
    }
    else {
      newPlayers = newPlayers.filter((p)=>{return p.userId !== userId+""})
      newPlayers.push(Object.assign(player, {score: player.score + points}))
    }
    game.players = newPlayers
    game.save().then((savedGame) => {
      let hideAnswer = savedGame 
      hideAnswer.song = {songUrl: hideAnswer.song.songUrl}
      socket.getIo()
      
      .in("Room: " + game.roomId)
      .emit("game", game);

      let waitingOn = Math.ceil(1.0* game.originalLength/2.0 - 0.001)
      if(savedGame.correctAnswers >= waitingOn) {
        endRound(game.roomId, game.roundNumber, game._id+"")
      }

    })

   
  }
  else {
    socket.getIo()
      
      .in("Room: " + game.roomId)
      .emit("message", msg);
  }
  })
  

  
};

module.exports = {
  startGame,
  guessAnswer,
};
