const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
var Promise = require("promise");
var ObjectId = require('mongodb').ObjectId
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
      game.usersAlreadyAnswered=[]
      game.correctAnswers = 0
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
 // console.log("Ended round" + roundNum);
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
          }) 
          updateLeaderboard(game.players, ""+room.category._id)
        }
        else {
          game.status = "RoundStarting";
          game.song = songs[0];
          game.statusChangeTime = fromNow(3000);
         
          game.roundNumber = game.roundNumber + 1;
          
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
guessAnswer = (userId, name, gameId, msg) => {
  Game.findById(gameId).then((game)=>{
    let correct = false
  let messageText = msg.message
  let title = game.song.title.replace(/ \([\s\S]*?\)/g, '')
  if(!game.usersAlreadyAnswered.map((e)=>{return e.userId}).includes(userId) && (game.status==="RoundInProgress")&&((similarity(messageText, title) > 0.7) || (similarity(messageText.toLowerCase().replace("fuck", "forget"), title) > 0.7) ||
  (similarity(messageText.toLowerCase().replace(" and ", " & "), title) > 0.7)))
    correct = true;
  if(correct) {
    
      socket.getIo()
      .in("Room: " + game.roomId)
      .emit("message", {
        roomId: game.roomId,

        message: name + " guessed the title!",
        style: "correct answer"
      });
    

    let givenPoints =  Math.floor(((new Date(game.statusChangeTime)).getTime() - (new Date()).getTime()))/1000.0
    let numAnswered = game.correctAnswers
    let points = 40 + Math.floor(givenPoints) + (numAnswered === 0 ? 30 : (numAnswered === 1 ? 15 : (numAnswered === 2 ? 5 : 0)))
    game.correctAnswers = numAnswered + 1
    let usersAlreadyAnswered = game.usersAlreadyAnswered
    usersAlreadyAnswered.push({
      userId: userId,
      userName: name,
      time: (30-givenPoints).toFixed(3),
      score: points
    })
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

const getLeaderboard = () => {
  return new Promise((resolve, reject) => {
    User.find({}, (err, users) => {
      Category.find({}, (err, categories) => {
        console.log(categories);
        var leaderboard = {};
        for (var j = 0; j < categories.length; j++) {
          leaderboard[categories[j]._id] = {
            topScores: [],
            topRatings: [],
          };
        }
        for (var i = 0; i < users.length; i++) {
          let topScores = [];
          let topRatings = [];
          let leaderboardData = users[i].leaderboardData;
          for (var j = 0; j < leaderboardData.length; j++) {
            if(!leaderboard[leaderboardData[j]]) continue;
            leaderboard[leaderboardData[j].categoryId].topScores.push({
              userId: users[i]._id,
              name: users[i].name,
              score: leaderboardData[j].highScore,
            });
            leaderboard[leaderboardData[j].categoryId].topRatings.push({
              userId: users[i]._id,
              name: users[i].name,
              rating: leaderboardData[j].rating,
            });
          }
        }
        for (var j = 0; j < categories.length; j++) {
          leaderboard[categories[j]._id].topScores.sort((a, b) => {
            return b.score - a.score;
          });
          leaderboard[categories[j]._id].topRatings.sort((a, b) => {
            return b.rating - a.rating;
          });
        }
        //console.log("got here 3")
        let res={ leaderboard: leaderboard, categories: categories }
        resolve(res);
      });
    });
  })
  
}

updateLeaderboard = (players, categoryId) => {
   let ratedPlayers = players.filter((p)=>{return p.rated})
   let k = 60/ratedPlayers.length
   
   User.find({_id: {$in: players.map((p)=>{return ObjectId(p.userId)})}}, (err, users)=>{
     console.log("players: " + users.length) 
     if(users.length === 0) {
       return;
     }
     let counter1 = 0
     //let userArray = users
      users.forEach((user1) => {
        let oldEntry = user1.leaderboardData.find((entry)=>{return entry.categoryId === categoryId})
        if(!oldEntry) oldEntry = {categoryId: categoryId, rating: 1200, highScore: 0}
        let player1 = players.find((p)=>{return p.userId === user1._id+""})
        let rating = oldEntry.rating
        oldEntry.highScore = Math.max(oldEntry.highScore, player1.score)
        let update = 0
        let counter2 = 0
        users.forEach((user2) => {
         let oldEntry2 = user2.leaderboardData.find((entry)=>{return entry.categoryId === categoryId})
         let player2rating = oldEntry2 ? oldEntry2.rating : 1200
         let player2 = players.find((p)=>{return p.userId === user2._id+""})
         let constant = 0
         if (player1.score>player2.score) {
           constant = 1
         } else if (player1.score === player2.score) {
           constant = 0.5
         }
         let p1 = 1.0 / (1.0 + Math.pow(10, (player2rating - rating) / 400.0));
         if(player2.rated && player1.rated) update += k*(constant - p1)
         counter2 += 1
         if(counter2 === users.length) {
           oldEntry.rating = rating + update
           let newLeaderboardData = user1.leaderboardData.filter((entry)=>{return entry.categoryId !== categoryId})
           newLeaderboardData.push(oldEntry)
           user1.leaderboardData = newLeaderboardData
           user1.save().then(() => {
             counter1+=1
             if(counter1 === users.length) {
               getLeaderboard().then((data) => {
                 socket.getIo().emit("leaderboard", data);
               }).catch((error) => {
                 console.error(error)
               })
               return;
             }
           })
           
         }
        
      })
     })
     
  })
   
}



module.exports = {
  startGame,
  guessAnswer,
  getLeaderboard
};
