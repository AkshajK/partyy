import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Timer from "../modules/Timer.js"
import { socket } from "../../client-socket.js";
import logo from "../images/logo4.png";
import PlayerTable from "../modules/PlayerTable.js"
import CorrectAnswerTable from "../modules/CorrectAnswerTable.js"
import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper";
import ListItem from "@material-ui/core/ListItem";
import Typography from '@material-ui/core/Typography';
import ListItemText from "@material-ui/core/ListItemText";
import CircularProgress from "@material-ui/core/CircularProgress";
import Chat from "../modules/Chat.js"
import Music from "../modules/Music.js"
import { get, post } from "../../utilities.js";

class Room extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {};
  }

  componentDidMount() {

    post("api/joinRoom", { name: this.props.computedMatch.params.roomName }).then((data) => {
      if (!data.exists) {
        return;
      }
      
      this.setState({
        roomId: data.room._id,
        name: data.room.name,
        rated: data.room.rated,
        host: data.room.host,
        status: data.room.status,
        created: data.room.created,
        closed: data.room.closed,
        private: data.room.private,
        allUserIdsThatHaveBeenInRoom: data.room.allUserIdsThatHaveBeenInRoom,
        exists: true,
        
        game: data.game,
        users: data.users.concat([]),
        category: data.category,
      });
      this.props.setShowSidebar(data.game.status !== "RoundInProgress");
    });

    socket.on("joinRoom", (data)=>{
      let users = this.state.users.concat([]) 
      users.push(data)
      this.setState({users: users})
    })

    socket.on("leftRoom", (data)=>{
      let users = this.state.users.filter((user)=>{return user.userId !== data.userId})
      this.setState({users: users})
    })

    socket.on("game", (game) => {
      console.log(game)
      
      if(game.status === "RoundFinished") {
        this.props.setShowSidebar(true);
      }
      else if(game.status === "RoundInProgress" && (this.state.game.status !== "RoundInProgress") ) {
        this.props.setShowSidebar(false);
      }
      this.setState({game: game})
    })
  }

  componentWillUnmount() {

    socket.off("joinRoom")
    socket.off("leftRoom")
    socket.off("game")
  }
  /*
  componentDidUpdate(prevProps) {
    if(this.props.url !== prevProps.url) // Check if it's a new user, you can also use some unique property, like the ID  (this.props.user.id !== prevProps.user.id)
    {
      this.componentDidMount();
    }
  } */

  render() {
    if (!this.state.exists) return <CircularProgress />;
    let timer = this.state.game && this.state.game.status !== "RoundFinished" ? <Timer endTime={this.state.game.statusChangeTime} max={this.state.game.status === "RoundInProgress" ? 30.0 : 3.0} /> : <div style={{height: "20px"}} />
    let roundMessage = "Waiting for players..."
    if(this.state.game) roundMessage = "Round " + this.state.game.roundNumber + " of 5" 
    let img = logo
    let answer = null
    if(this.state.game) {
      let songs = this.state.game.songHistory
      
      if(songs.length > 0) {
        answer= songs[songs.length - 1]
        img = answer.artUrl
      }
    }
    let header = "Waiting to Start"
    if(this.state.game) {
      if(this.state.game.status !== "RoundInProgress") {
        if(answer) header = "Answer: " + answer.title + " by " + answer.artist
        else header = "Get ready"
      }
      else header = "Guess the Song"
      
    }

    let playingMusic = this.state.game && (this.state.game.status === "RoundInProgress")
      return (
      <Grid container direction="row" style={{ width: "100%", height: "100%" }}>
        <Grid container direction="column" style={{width:"calc(100% - 300px)", height: "100%"}}>
        {timer}
        <Typography variant="h5" align="center" color="textPrimary" gutterBottom style={{marginTop: "10px"}}>
          {header}
        </Typography>
        <Grid container direction="row" style={{width:"calc(100% - 40px)", margin: "20px 20px 20px 20px"}}>
          {!(this.state.game && (this.state.game.status === "RoundInProgress" || (this.state.game.correctAnswers > 0))) ?
              <Box width="100%">
              <PlayerTable users={this.state.users} players={(this.state.game || {}).players} />
              </Box>
          :
          <React.Fragment>
          <Box width="calc(40% - 10px)">
          <PlayerTable users={this.state.users} players={(this.state.game || {}).players} />
          </Box>
          <Box width="20px"></Box>
          <Box width="calc(60% - 10px)">
          <CorrectAnswerTable correctAnswers={this.state.game ? this.state.game.usersAlreadyAnswered : []} />
          </Box></React.Fragment>}
        </Grid>
        </Grid>
        <Box width="300px" height="100%" bgcolor="sidebar">
            <Box style={Object.assign({height: "240px", overflow: "auto"}, playingMusic?{}:{width: "100%",  display: "flex", justifyContent:"center", alignItems: "center"})}>
              {playingMusic ?                 <Music url = {this.state.game.song.songUrl} visual={window.AudioContext ? true : false} pauseButton={window.AudioContext ? false : true}  />
: <img src = {img} height={"240px"} />}
            </Box> 
            <Typography variant="h5" align="center" color="textPrimary" gutterBottom style={{marginTop: "10px"}} >
              {roundMessage}
            </Typography>
            
            <Chat messages={this.props.messages.filter((msg)=>{return msg.roomId === this.state.roomId})}  />
            <Button fullWidth
              onClick={() => {
                post("api/startGame")
              }}
              disabled={this.state.game && this.state.game.status !== "RoundFinished"}
            >
              Start Game
            </Button>
            <Button fullWidth
              onClick={() => {
                post("api/leaveRoom", { roomId: this.state.roomId }).then((data) => {
                  this.props.redirect("/");
                });
              }}
            >
              Leave Room
            </Button>
            
          
        </Box>
      </Grid>
    );
  }
}

export default Room;
