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
  Category.find({}, (err, categories) => {
    Song.find({}, (err, songs) => {
      let ans = []
      for(var i=0; i<categories.length; i++) {
        let songC = songs.filter((s)=>{return s.categoryId===categories[i]._id+""})
        let obj = {category: categories[i], songs: songC}
        ans.push(obj);


      }
      res.send(ans);
    })
  })
};
require("dotenv").config();

var SpotifyWebApi = require('spotify-web-api-node');

/*
addCategory
Input (req.body): 
Precondition: 
Socket: 
Returns:  
Description:
*/
addCategory = (req, res) => {
  var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_ID,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: 'http://localhost:5000/dashboard'
  });
  spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
   
      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
      console.log(req.body.playlistId)
  spotifyApi.getPlaylist(req.body.playlistId).then((data) => {
    const category = new Category({
      name: data.body.name
    })
    category.save().then((saved)=> {
      let tracks = data.body.tracks.items 
      let counter = 0
    for(var i=0; i<tracks.length; i++) {
      let songApi = tracks[i].track
      let song = new Song({
        artist: songApi.artists[0].name,
        title: songApi.name,
        artUrl: songApi.album.images[0].url,
        songUrl: songApi.preview_url,
        categoryId: saved._id,
      })
      song.save().then(() => {
        counter += 1
        if(counter === tracks.length) {
          res.send({error: false});
        }
      })
    }
    })
    
  }, (err) => {
    console.log(err)
    res.send({error: true})
  })
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    }
  );
  
};



module.exports = {
  getCategoryAndSongData,
  addCategory
};
