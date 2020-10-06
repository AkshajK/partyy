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
        const game = new Game({
          roomId: room._id,
          song: { songUrl: songs[0].songUrl },
          songHistory: [],
          players: room.users.map((oneuser) => {
            return { userId: oneuser };
          }),
          statusChangeTime: fromNow(3000),
        });
        game.save().then((savedGame) => {
          room.gameId = savedGame._id;
          room.save().then(() => {
            socket
              .getIo()
              .in("Room: " + room._id)
              .emit("game", savedGame);
            setTimeout(() => {
              startRound(room._id, 1, savedGame._id+"", songs[0]);
            }, 3000);
            res.send({})
          });
        });
      });
    });
  });
};

startRound = (roomId, roundNum, gameId, curSong) => {
  //console.log("Started Round " + roundNum);
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
          endRound(room._id, roundNum, gameId, curSong);
        }, 30000);
      });
    });
  });
};

endRound = (roomId, roundNum, gameId, curSong) => {
  //console.log("Ended round" + roundNum);
  Room.findById(roomId).then((room) => {
    if (room.gameId === "Waiting") return;
    Game.findById(room.gameId).then((game) => {
      if (
        !(game._id+"" === gameId && game.status === "RoundInProgress" && game.roundNumber === roundNum)
      )
        return;
      let songHistory = game.songHistory;
      songHistory.push(curSong);
      game.songHistory = songHistory;
      Song.aggregate([{ $sample: { size: 1 } }], (err, songs) => {
        if (roundNum === NUM_ROUNDS) game.status = "RoundFinished";
        else {
          game.status = "RoundStarting";
          game.song = { songUrl: songs[0].songUrl };
          game.statusChangeTime = fromNow(3000);
          game.roundNumber = game.roundNumber + 1;
        }
        game.save().then((savedGame) => {
          socket
            .getIo()
            .in("Room: " + room._id)
            .emit("game", savedGame);
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

guessAnswer = (req, res) => {};

module.exports = {
  startGame,
  guessAnswer,
};
