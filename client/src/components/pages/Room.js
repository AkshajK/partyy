import React, { Component } from "react";
import {  notification, Space } from 'antd';
import "../../utilities.css";
import {Modal} from "antd"
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Timer from "../modules/Timer.js"
import { socket } from "../../client-socket.js";
import logo from "../images/logodark.png";
import spotifylogo from "../images/Spotify_Logo_RGB_White.png";
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
import EditName from "../modules/EditName.js"

class Room extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      buttonColor: "#1565c0",
      
    };
  }

  componentDidMount() {

    post("api/joinRoom", { name: this.props.computedMatch.params.roomName }).then((data) => {
      if (!data.exists) {
        this.props.error();
        return;
      }
      let mobile  = this.props.mobile < 500
      this.setState({
        roomId: data.room._id,
        name: data.room.name,
        rated: data.room.rated,
        host: data.room.host,
        status: data.room.status,
        created: data.room.created,
        closed: data.room.closed,
        private: data.room.private,
       
        exists: true,
        
        game: data.game,
        users: data.users.concat([]),
        category: data.room.category,
        modal: (true),
      });
     // console.log(this.state.mobile);
      if(!mobile) this.props.setShowSidebar(!data.game || (data.game.status !== "RoundInProgress"));
      else this.props.setShowSidebar(false);
      this.props.setCategory(data.room.category);
      this.props.setUsers(data.users);
      this.props.setLobby(false);
      //console.log(data.room.category)
    });

    socket.on("joinRoom", (data)=>{
      let users = this.state.users.concat([]) 
      if(users.find((u=>{return u.userId === data.userId})))
        return;
      users.push(data)
      this.setState({users: users})
      this.props.setUsers(users)
    })

    socket.on("leftRoom", (data)=>{
      let users = this.state.users.filter((user)=>{return user.userId !== data.userId})
      this.setState({users: users})
      this.props.setUsers(users)
    })

    socket.on("game", (game) => {

      
      if(game.status === "RoundFinished") {
        if(!this.props.mobile) this.props.setShowSidebar(true);
        this.props.setCategory(this.state.category);
      }
      else if(game.status === "RoundInProgress" && (this.state.game.status !== "RoundInProgress") ) {
        this.props.setShowSidebar(false);
      }
      this.setState({game: game})
    })

    socket.on("changeName", (user)=>{
      let users = this.state.users 
      let filtered = users.filter((u)=>{return u.userId !== user.userId})
      if(users.length !== filtered.length) {
        filtered.push(user);
        this.setState({users: filtered});
        this.props.setUsers(filtered);
      }
    })
  }

  componentWillUnmount() {

    socket.off("joinRoom")
    socket.off("leftRoom")
    socket.off("game")
    socket.off("changeName")
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
    let timer = this.state.game && this.state.game.status !== "RoundFinished" ? <Timer color={"#FF0000"} rainbow={this.props.rainbow} endTime={this.state.game.statusChangeTime} max={this.state.game.status === "RoundInProgress" ? 30.0 : 3.0} /> : <div style={{height: "20px"}} />
    let roundMessage = "Waiting for players..."
    if(this.state.game) roundMessage = "Round " + this.state.game.roundNumber + " of 5" 
    let img = logo
    let answer = null
    if(this.state.game) {
      let songs = this.state.game.songHistory
      
      if(songs.length > 0) {
        answer= songs[songs.length - 1]
        if(answer.artUrl) img = answer.artUrl
      }
    }
    let header = "Waiting to Start"
    if(this.state.game) {
      if(this.state.game.status !== "RoundInProgress") {
        if(answer) header = "Answer: " + answer.title + " by " + answer.artist[0]
        else header = "Get ready"
      }
      else header = "Guess the Song"
      
    }

    let playingMusic = this.state.game && (this.state.game.status === "RoundInProgress")
    let disabled = this.state.game && this.state.game.status !== "RoundFinished" && this.state.disable
    let editName = <EditName open={this.state.modal} onClose={()=>{
      this.setState({modal: false})
      if(this.state.category && this.state.category.name && !this.props.mobile) {
       
          notification.success({
            message: 'This is a ' + this.state.category.name + " room",
            description: 'Guess the title or artist, or type \'skip\' to skip'
            
          });
    
      }
    }} title={"Enter your Name"} submitText={"Join the Partyy!"} 
    changeName = {this.props.changeName} onSubmit={()=>{}} userName={this.props.name} />
    let music =  <Music modal={this.state.modal} setModal={()=>{this.setState({modal: false})}} url = {this.state.game ? (this.state.game.song ? this.state.game.song.songUrl : undefined) : undefined} visual={window.AudioContext && !this.props.mobile ? true : false} mobile={this.props.mobile} pauseButton={window.AudioContext && !this.props.mobile ? false : true} rainbow={this.props.rainbow} toggleRainbow={()=>{
      notification.success({
        message: 'Switched to ' + (!this.props.rainbow ? 'Rainbow' : 'Blue') + ' Mode',
        
      });
      this.props.toggleRainbow()
    }}   />
    let spotifyUrl = this.state.game ? this.state.game.song ? this.state.game.song.spotifyUrl : undefined : undefined
    spotifyUrl = spotifyUrl || (answer ? answer.spotifyUrl : undefined)
      return (
      <Grid container direction="row" style={{ width: "100%", height: "100%", overflow:"auto" }}>
        <Grid container direction="column" style={{width: this.props.mobile ? "100%" : "calc(100% - 320px)", height: "100%"}}>
        {timer}
        {editName}
        <Typography component={'div'} variant="h5" align="center" color="textPrimary" gutterBottom style={{margin: "10px 20px 0px 20px", overflow: "auto", width: "calc(100% - 40px)"}} noWrap>
          {header}
        </Typography>
        <Grid container direction="row" style={{width:"calc(100% - 40px)", margin: "20px 20px 20px 20px", height: this.props.mobile ? "calc(50% - 80px)" :"calc(100% - 180px)", overflow: "auto"}}   >
          {this.props.mobile || !(this.state.game && (this.state.game.status === "RoundInProgress" || (this.state.game.correctAnswers > 0))) ?
              <Box width="100%">
              <PlayerTable mobile={this.props.mobile} userId = {this.props.userId} users={this.state.users} players={(this.state.game || {}).players} />
              </Box>
          :
          <React.Fragment>
          <Box width="calc(40% - 10px)">
          <PlayerTable mobile={this.props.mobile} userId = {this.props.userId} users={this.state.users} players={(this.state.game || {}).players} />
          </Box>
          <Box width="20px"></Box>
          <Box width="calc(60% - 10px)">
          <CorrectAnswerTable userId = {this.props.userId}  correctAnswers={this.state.game ? this.state.game.usersAlreadyAnswered : []} />
          </Box></React.Fragment>}
          
        </Grid>
        {this.props.mobile ? 
                    <Box style={{margin: "0px 20px 20px 20px"}} height="calc(50% - 100px)">
                      <Chat mobile={true} categoryName={this.state.category.name} messages={this.props.messages.filter((msg)=>{return msg.roomId === this.state.roomId})} inGame={this.state.game && this.state.game.status === "RoundInProgress"}  />     
                      </Box> : <React.Fragment />}
        <Box style={{margin: "0px 20px 0px 20px"}}>
        {this.props.mobile ? 
        <Grid container fullWidth spacing={2} direction="row">
          <Grid  item xs={6}>
            {playingMusic ? 
            music
            :
          <Button fullWidth size="large" color="primary" variant="outlined"
              onClick={() => {
                this.setState({disable: true}, ()=>{
                post("api/startGame").then((e)=>{
                  if(e.error) this.props.error();
                  this.setState({disable: false})
                })
                })
              }}
              disabled={disabled || this.state.disable}
            >
              
              <Typography noWrap variant="button"> {"Start Game"} </Typography>
             
            </Button>}
          </Grid>
          <Grid item xs={6}>
          <Button fullWidth size="large" color="primary" variant="outlined"
              onClick={() => {
                post("api/leaveRoom", { roomId: this.state.roomId, name: this.state.name }).then((data) => {
                  this.props.redirect("/");
                });
              }}
        
            >
              
              <Typography noWrap variant="button"> {"Leave Room"} </Typography>
             
            </Button>
          </Grid>
        </Grid>
              :
        <Button fullWidth size="large" color="primary" variant="outlined"
              onClick={() => {
                this.setState({disable: true}, ()=>{
                post("api/startGame").then((e)=>{
                  if(e.error) this.props.error();
                  this.setState({disable: false})
                })
                })
              }}
              disabled={disabled || this.state.disable}
            >
              
              <Typography noWrap variant="button"> {"Start " + (this.state.category ? this.state.category.name : "") + " Game"} </Typography>
             
            </Button>
             } 
            </Box>
        </Grid>
        
        <Box width={this.props.mobile ? "0px" : "320px"} height="100%" bgcolor="sidebar">
            <Box  style={Object.assign({height: "240px", overflow: "auto"}, playingMusic?{}:{width: "100%",  display: "flex", justifyContent:"center", alignItems: "center"})}>
              {playingMusic && !this.state.modal ?  (this.props.mobile ? <></>:music)
: <img src = {img} height={"240px"} />}
            </Box> 
            {this.props.mobile ? <React.Fragment /> : <React.Fragment>
            <Typography component={'div'} variant="h5" align="center" color="textPrimary" gutterBottom style={{marginTop: "10px"}} >
              {roundMessage}
            </Typography>
            
            <Chat error={this.props.error} categoryName={this.state.category.name} messages={this.props.messages.filter((msg)=>{return msg.roomId === this.state.roomId})} inGame={this.state.game && this.state.game.status === "RoundInProgress"}  />
            
            <Button fullWidth
              onClick={() => {
                this.props.setShowSidebar(!this.props.showSidebar)
              }}
           
            >
              {this.props.showSidebar ? "Hide Leaderboard" : "Show Leaderboard"}
            </Button>
            <Button fullWidth
              onClick={() => {
                post("api/leaveRoom", { roomId: this.state.roomId, name: this.state.name }).then((data) => {
                  this.props.redirect("/");
                });
              }}
            >
              Leave Room
            </Button>
           
              <Button fullWidth onClick={()=>{window.open(spotifyUrl, '_blank')}} disabled={!spotifyUrl}> 
                View Song On <img src={spotifylogo} style={{marginLeft: "12px"}} width="80px" />
              </Button>
            
           
            {/*<Button fullWidth
              onClick={() => {
                post("api/reportSong", { songUrl: this.state.game.song.songUrl }).then((data) => {
                  if(data.reported) {
                    notification.success({
                      message: 'Reported',
                      description:
                        'You reported a song',
                    });
                  }
                });
              }}
              disabled={!this.state.game || !this.state.game.song}
            >
              Report Song
            </Button>*/}
            </React.Fragment>
            }
            
          
        </Box>
      </Grid>
    );
  }
}

export default Room;
