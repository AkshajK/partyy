const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");
const socket = require("./server-socket");
var Promise = require("promise");
const random = require('random')
var filter = new Filter();
filter.removeWords('god');
const {
  bubbleSort,
  selectionSort,
  insertionSort,
  radixSort,
  heapSort,
  quickSort,
  mergeSort 
} = require('sort-algorithms-js');
const lock = require("./lock").lock;



var ObjectId = require('mongodb').ObjectId
const NUM_ROUNDS = 5;
let fromNow = (num) => {
  return new Date(new Date().getTime() + num);
};

startGame = (req, res) => {
 
    //console.log(songs)
  User.findById(req.user._id).then((user) => {
    if(user.roomId === "Offline" || user.roomId === "Lobby") {
      res.send({error: true});
      return;
    }
    lock.acquire("room"+req.body.name, function(done) {
    Room.findById(user.roomId).then((room) => {
      Song.aggregate([{$match:
        {categoryId: room.category._id+"" } }, { $sample: { size: 1 } }], async (err, songs) => {
        if (room.status === "InProgress") {
          res.send({})
          done({}, {});
          return;
        }
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
        let savedGame = await game.save();

          room.gameId = savedGame._id;
          room.created = new Date();
          room.host = {
            userId: req.user._id,
            name: user.name
          }
          room.save().then((savedRoom) => {
            
              if(!savedRoom.private) {
                socket
              .getIo()
              .in("Room: Lobby")
              .emit("room", savedRoom);
              }
            
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
            done({}, {});
          });
        });
      });
    }, function(err, ret){});
  });
  
};

let calculate = (difficulty) => {
  let uniform = random.uniform(min=0, max=1);
  if(difficulty >= 15) {
    if(uniform() > 0.5) return 31;
  }
  else {
    if(difficulty >= 10) {
    if(uniform() > 0.8) return 31;
    }
  }
  const normal = random.normal(mu=difficulty, sigma=1);
 let ans = normal();
 //console.log(Math.max(ans, 3));
  return Math.max(ans, 3+uniform())
}

startRound = (roomId, roundNum, gameId) => {
  //console.log("Started Round " + roundNum);
  Room.findById(roomId).then(async (room) => {
    //console.log(room.gameId)
    if (room.gameId === "Waiting") return;
    let game = await Game.findById(room.gameId);

      //console.log(game._id + " " + gameId + " " + game.status + " " + game.roundNumber + " " + (!(game._id == gameId && game.status === "RoundStarting" && game.roundNumber === roundNum)))
      
      if (!((game._id+"" === gameId) && (game.status === "RoundStarting") && (game.roundNumber === roundNum)))
        return;
      
      game.status = "RoundInProgress";
      game.statusChangeTime = fromNow(30000);
      game.usersAlreadyAnswered=[]
      game.correctAnswers = 0

      let savedGame = await game.save();
      let answer = savedGame.song.title;
      let hideAnswer = Object.assign(savedGame, {song: {songUrl: savedGame.song.songUrl}})
          
        socket
          .getIo()
          .in("Room: " + room._id)
          .emit("game", hideAnswer);
        setTimeout(() => {
          endRound(room._id, roundNum, gameId);
        }, 30000);

        /*BOT STUFF*/
        room.users.forEach((userId) => {
          User.findById(userId).then((user)=> {
            if(!user.bot) return;
            let timeTaken = calculate(user.difficulty)*1000;
            setTimeout(async ()=>{
              //console.log(game.song);
              await guessAnswer(user._id, user.name, game._id, {message: answer}, true)
            }, timeTaken)
          })
        })





    
   
  });
};

endRound = (roomId, roundNum, gameId) => {
 // console.log("Ended round" + roundNum);
 lock.acquire(gameId+"Guess", function(done) {

 
  Room.findById(roomId).then(async (room) => {
    if (room.gameId === "Waiting") {
      done({}, {});
      return;
    }
    let game = await Game.findById(room.gameId)
      if (
        !(game._id+"" === gameId && game.status === "RoundInProgress" && game.roundNumber === roundNum)
      ) {
        done({}, {});
        return;
      }
      
    Song.aggregate([{$match:
        {categoryId: room.category._id+"" } }, { $sample: { size: 1 } }], async (err, songs) => {

       game = await Game.findById(room.gameId)
       let songHistory = game.songHistory;
        songHistory.push(game.song);
        game.songHistory = songHistory;
        if (roundNum === NUM_ROUNDS) {
          game.status = "RoundFinished";
          room.status = "Finished"

          room.save().then((savedRoom)=>{
            if(!savedRoom.private) {
            socket
            .getIo()
            .in("Room: Lobby")
            .emit("room", savedRoom);
            }
          }) 
          updateLeaderboard(game.players, ""+room.category._id)
        }
        else {
          game.status = "RoundStarting";
          game.song = songs[0];
          game.statusChangeTime = fromNow(3000);
         
          game.roundNumber = game.roundNumber + 1;
          
        }
        let savedGame = undefined;
        savedGame = await game.save();
        
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
          done({}, {});
        });
      });
    }, function(err, ret) {});
 
};

var stringSimilarity = require('string-similarity');

let similarity = (a, b) => {
  return stringSimilarity.compareTwoStrings(a.toLowerCase(),b.toLowerCase());
}
let similar = (title, messageText) => {
  //console.log(title);
  //console.log(messageText);
  return (similarity(messageText, title) > 0.7) || (similarity(messageText.toLowerCase().replace("fuck", "forget"), title) > 0.7) ||
  (similarity(messageText.toLowerCase().replace(" and ", " & "), title) > 0.7);
}

let similarArtist = (arr, messageText) => {
  for(var i=0; i<arr.length; i++) {
    if(similar(arr[i], messageText)) return true;
  }
  return false;
}
const guessAnswer = async (userId, name, gameId, msg, bot) => {
  lock.acquire(gameId+"Guess", async function(done) {
  let game = await Game.findById(gameId);
 
    let correct = false
    let correctArtist = false;
    let skip = false;
 
  let messageText = msg.message
  
  let title = game.song.title.replace(/ \([\s\S]*?\)/g, '')
  title = title.replace(/ \[[\s\S]*?\]/g, '')
  if(title.includes("-")) {
    let lowercase = title.split("-")[1].toLowerCase();
    if(lowercase.includes("radio edit") || lowercase.includes("remix") || lowercase.includes("remaster") || lowercase.includes("cover") || lowercase.includes("from") || lowercase.includes("version") || lowercase.includes("track") || lowercase.includes("recorded")) {
      title = title.split("-")[0]
    }
  }
  if(!game.usersAlreadyAnswered.filter((e)=>{return e.style === "correct answer" || e.style === "skip"}).map((e)=>{return e.userId}).includes(userId) && (game.status==="RoundInProgress")&&((game.song.title === messageText)|| similar(title, messageText)))
    correct = true;
  if(!game.usersAlreadyAnswered.filter((e)=>{return e.style === "correct artist" || e.style === "correct answer" || e.style === "skip"}).map((e)=>{return e.userId}).includes(userId) && (game.status==="RoundInProgress")&&((game.song.title === messageText)|| similarArtist(game.song.artist, messageText)))
    correctArtist = true;
  if(!game.usersAlreadyAnswered.filter((e)=>{return e.style === "skip" || e.style === "correct answer"}).map((e)=>{return e.userId}).includes(userId) && (game.status==="RoundInProgress")&&((messageText.toLowerCase() === "skip")))
    skip = true;

  if(correct) {
    
      
    

    let givenPoints =  Math.floor(((new Date(game.statusChangeTime)).getTime() - (new Date()).getTime()))/1000.0
    let numAnswered = game.correctAnswers
    let points = 40 + Math.floor(givenPoints) + (numAnswered === 0 ? 30 : (numAnswered === 1 ? 15 : (numAnswered === 2 ? 5 : 0)))
    
    let usersAlreadyAnswered = game.usersAlreadyAnswered
    let origScore = 0;
    let myAuthor = usersAlreadyAnswered.find((r)=>{return r.userId === userId});
    if(myAuthor) {
      origScore = myAuthor.score;
      usersAlreadyAnswered = usersAlreadyAnswered.filter((r)=>{return r.userId !== userId})
    }
    usersAlreadyAnswered.push({
      userId: userId,
      userName: name,
      time: (30-givenPoints).toFixed(3),
      score: points,
      style: "correct answer"
    })
    
    let newPlayers = game.players
    let player = newPlayers.find((p)=>{return p.userId === userId+""})
    
    if(!player) {
      newPlayers.push({
        userId: userId,
        score: points-origScore,
        rated: false
      })
    }
    else {
      newPlayers = newPlayers.filter((p)=>{return p.userId !== userId+""})
      newPlayers.push(Object.assign(player, {score: player.score + points-origScore}))
    }

    let savedGame = undefined;
    
   
    game.correctAnswers = numAnswered + 1
    game.usersAlreadyAnswered=usersAlreadyAnswered
    game.players = newPlayers

   
    savedGame = await game.save();
    done(undefined, {game: savedGame, style: "correct answer"})

   
  }
  else if(correctArtist) {
    let givenPoints =  Math.floor(((new Date(game.statusChangeTime)).getTime() - (new Date()).getTime()))/1000.0
   
    let points = 25 + Math.floor(givenPoints)
    
    let usersAlreadyAnswered = game.usersAlreadyAnswered
    usersAlreadyAnswered.push({
      userId: userId,
      userName: name,
      time: (30-givenPoints).toFixed(3),
      score: points,
      style: "correct artist"
    })
    
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

    let savedGame = undefined;

    game.usersAlreadyAnswered=usersAlreadyAnswered
    game.players = newPlayers

   
    savedGame = await game.save();
    done(undefined, {game: savedGame, style: "correct artist"})

  }
  else if(skip) {
    let usersAlreadyAnswered = game.usersAlreadyAnswered
    usersAlreadyAnswered.push({
      userId: userId,
      userName: name,
      time: 0,
      score: 0,
      style: "skip"
    })
    game.usersAlreadyAnswered=usersAlreadyAnswered
    savedGame = await game.save();
    done(undefined, {game: savedGame, style: "skip"})
  }
  else {
    msg.message = filter.clean(msg.message);
    if(!bot) socket.getIo()
      
      .in("Room: " + game.roomId)
      .emit("message", msg);
      done(undefined, undefined)
  }

}, function(err, data) {
  if(!data) {
    //console.log("Fail")
    return;
  }
let savedGame = data.game
let anotherMsg = new Message({
  roomId: savedGame.roomId,

  message: name + (data.style === "correct answer" ?  " guessed the title!" : (data.style === "correct artist" ? " guessed the artist!" : " skipped")),
  style: data.style
});
socket.getIo()
  .in("Room: " + savedGame.roomId)
  .emit("message", anotherMsg);
  
  let hideAnswer = savedGame 
  hideAnswer.song = {songUrl: hideAnswer.song.songUrl}
  socket.getIo()
  
  .in("Room: " + savedGame.roomId)
  .emit("game", hideAnswer);

  let waitingOn = Math.ceil(1.0* savedGame.originalLength/2.0 - 0.001)
  if(savedGame.correctAnswers >= waitingOn  ||  (savedGame.correctAnswers + savedGame.usersAlreadyAnswered.filter((r)=>{return r.style==="skip"}).length >= savedGame.originalLength)) {
    
    endRound(savedGame.roomId, savedGame.roundNumber, savedGame._id+"");
    
  }
})
  

  

  
};

var curLeaderboard = {leaderboard: {}, categories: []}

let isEqual = (a, b) => {
  for(var i=0; i<a.length; i++) {
    if(!b.includes(a[i])) return false;
  }
  return a.length === b.length;
}

const getLeaderboard = (useCurrent, modifiedUserIds) => {
  
  return new Promise((resolve, reject) => {
    lock.acquire("leaderboard", (done)=>{
    
      Category.find({}, (err, categories) => {
        
        // check if categories is the same
        let sameCategories = isEqual(categories.map((c=>{return c._id+""})), curLeaderboard.categories.map((c=>{return c._id+""})))

        if(sameCategories && useCurrent && curLeaderboard.categories.length > 0) {
          resolve(curLeaderboard);
          done({}, {})
        }
        let reset = !sameCategories || !modifiedUserIds;
        var leaderboard = reset ? {} : curLeaderboard.leaderboard;

        User.find(reset ? {} : {_id: {$in: modifiedUserIds}}, (err, users) => {
        if(reset) {
          for (var j = 0; j < categories.length; j++) {
            leaderboard[""+categories[j]._id] = {
              topScores: [],
              topRatings: [],
            };
          }
        }
        else {
          let arrUserIds = modifiedUserIds.map((a)=>{return a+""});
          for (var j = 0; j < categories.length; j++) {
            leaderboard[categories[j]._id].topScores = leaderboard[categories[j]._id].topScores.filter((a)=>{return !arrUserIds.includes(a.userId+"")})
            leaderboard[categories[j]._id].topRatings = leaderboard[categories[j]._id].topRatings.filter((a)=>{return !arrUserIds.includes(a.userId+"")})
          }
        }
        for (var i = 0; i < users.length; i++) {
         
          let topScores = [];
          let topRatings = [];
          let leaderboardData = users[i].leaderboardData;
          for (var j = 0; j < leaderboardData.length; j++) {
            if(!leaderboard[leaderboardData[j].categoryId]) continue;
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
          if(reset) {
          leaderboard[categories[j]._id+""].topScores.sort((a, b) => {
            return b.score - a.score;
          });
          leaderboard[categories[j]._id+""].topRatings.sort((a, b) => {
            return b.rating - a.rating;
          });
          
          }
          else {
            leaderboard[categories[j]._id+""].topScores = insertionSort(leaderboard[categories[j]._id+""].topScores, (a, b) => {
              return b.score - a.score;
            });
            leaderboard[categories[j]._id+""].topRatings = insertionSort(leaderboard[categories[j]._id+""].topRatings, (a, b) => {
              return b.rating - a.rating;
            });
          }
        }
        //console.log("got here 3")
        let res={ leaderboard: leaderboard, categories: categories }
        curLeaderboard = res;
        resolve(res);
        done({}, {});
      });
    });
    }, (err, ret)=>{})
  })
  
}

updateLeaderboard = (players, categoryId) => {
   let ratedPlayers = players.filter((p)=>{return p.rated})
   let k = 60/ratedPlayers.length
   let playerIds =  players.map((p)=>{return ObjectId(p.userId)})
   User.find({_id: {$in: playerIds}}, (err, users)=>{

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
           oldEntry.rating = rating + update + 1.0
           let newLeaderboardData = user1.leaderboardData.filter((entry)=>{return entry.categoryId !== categoryId})
           newLeaderboardData.push(oldEntry)
           user1.leaderboardData = newLeaderboardData
           user1.save().then(() => {
             counter1+=1
             if(counter1 === users.length) {
               getLeaderboard(false, playerIds).then((data) => {
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
