const User = require("./models/user");
const Game = require("./models/game");
const Song = require("./models/song");
const Message = require("./models/message");
const Room = require("./models/room");
const Category = require("./models/category");

/*
getCategoryAndSongData
Input (req.body): {}
Precondition: 
Socket: None
Returns: {[{category: Category, songs: [Song]}]}
Description: Returns all the categories, with all the songs in each category
*/
getCategoryAndSongData = (req, res) => {
  if(!req.user.isSiteAdmin) return;
  Category.find({}, (err, categories) => {
    Song.find({}, (err, songs) => {
      let ans = [];
      for (var i = 0; i < categories.length; i++) {
        let songC = songs.filter((s) => {
          return s.categoryId === categories[i]._id + "";
        });
        let obj = { category: categories[i], songs: songC };
        ans.push(obj);
      }
      res.send(ans);
    });
  });
};
require("dotenv").config();

var SpotifyWebApi = require("spotify-web-api-node");

var Promise = require("promise");

let getSongs = (playlistId, offSet, spotifyApi, categoryId) => {
  var total = 100
  return new Promise((resolve, reject) => {
    spotifyApi
      .getPlaylistTracks(playlistId, {
        offset: offSet,
        limit: 100,
        fields: "items",
        market: "US"
      })
      .then((data) => {
        let tracks = data.body.items
        if (tracks.length === 0) {
          resolve();
          return;
        }
        let counter = 0;
        for (var i = 0; i < tracks.length; i++) {
          let songApi = tracks[i].track;
          
          if(songApi && songApi.preview_url) {
            let song = new Song({
              artist: songApi.artists[0] ? songApi.artists[0].name : "Artist",
              title: songApi.name,
              artUrl: songApi.album.images[0] ? songApi.album.images[0].url : undefined,
              songUrl: songApi.preview_url,
              categoryId: categoryId,
            });
          song.save().then(() => {
            //console.log("Yes preview url" + counter)
            counter += 1;
            if (counter === tracks.length) {
              if (tracks.length === 100) {
                getSongs(playlistId, offSet + 100, spotifyApi, categoryId).then(() => {
                  resolve();
                });
              }
              else {
                resolve();
              }
            }
          });
          }
          else {
            //same thing but dont saave song
           // console.log("No preview url" + counter + " avail markets: " + songApi.available_markets)
            counter += 1;
            if (counter === tracks.length) {
              if (tracks.length === 100) {
                getSongs(playlistId, offSet + 100, spotifyApi, categoryId).then(() => {
                  resolve();
                });
              }
              else {
                resolve();
              }
            }
            
          }
        }
      });
  });
};
/*
addCategory
Input (req.body): 
Precondition: 
Socket: 
Returns:  
Description:
*/
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_ID,
  clientSecret: process.env.SPOTIFY_SECRET,
  redirectUri: process.env.URL+"/api/addCategory",
});

addCategoryAuthenticate = (req, res) => {
  if(!req.user.isSiteAdmin) return;
  var scopes = ['user-read-private', 'user-read-email', 'playlist-read-private']
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, req.body.name+"-----"+req.body.playlistId);
  res.send({url: authorizeURL});
  //playlist-read-collaborative
}


addCategory = (req, res) => {
  if(!req.user.isSiteAdmin) return;
  var code  = req.query.code; 
  var state = req.query.state;
  var playlistId = state.split("-----")[1]
  var name = state.split("-----")[0]
  spotifyApi.authorizationCodeGrant(code).then(
    function (data) {
      console.log("The access token expires in " + data.body["expires_in"]);
      console.log("The access token is " + data.body["access_token"]);

      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      console.log(playlistId);

      Category.findOne({name: name}).then((c)=> {
        if(c) {
          console.log("found")
          Song.remove({categoryId: c._id}).then(() => {
            c.playlistId = playlistId
            c.save().then(
              (saved) => {
                
                getSongs(playlistId, 0, spotifyApi, saved._id).then(() => {
                  res.redirect('/dashboard');
                });
              },
              (err) => {
                console.log(err);
                res.send({ error: true });
              }
            );
          })
          
        }
        else {
          const category = new Category({
            name: name,
            playlistId: playlistId,
          });
          category.save().then(
            (saved) => {
              
              getSongs(playlistId, 0, spotifyApi, saved._id).then(() => {
                res.redirect('/dashboard');
              });
            },
            (err) => {
              console.log(err);
              res.send({ error: true });
            }
          );
        }
      })
      
    },
    function (err) {
      console.log("Something went wrong when retrieving an access token", err);
    }
  );
};

var ObjectId = require('mongodb').ObjectId
deleteCategory = (req, res) => {
  if(!req.user.isSiteAdmin) return;
  Category.remove({_id: ObjectId(req.body.categoryId)}).then(() => {
    Song.remove({categoryId: req.body.categoryId}).then(() => {
      Room.remove({"category._id": ObjectId(req.body.categoryId)}).then(() => {
        res.send({})
      })
    })
  });
  
  
}


module.exports = {
  getCategoryAndSongData,
  addCategory,
  addCategoryAuthenticate,
  deleteCategory
};
