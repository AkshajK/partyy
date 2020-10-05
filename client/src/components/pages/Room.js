import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import { socket } from "../../client-socket.js";

import PlayerTable from "../modules/PlayerTable.js"
import CorrectAnswerTable from "../modules/CorrectAnswerTable.js"
import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import CircularProgress from "@material-ui/core/CircularProgress";
import Chat from "../modules/Chat.js"
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
  }

  componentWillUnmount() {

    socket.off("joinRoom")
    socket.off("leftRoom")
    
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
    return (
      <Grid container direction="row" style={{ width: "100%" }}>
        <Grid container direction="row" style={{width:"calc(100% - 300px)"}}>
          <Box width="50%">
          <PlayerTable users={this.state.users} />
          </Box>
          <Box width="50%">
          <CorrectAnswerTable correctAnswers={this.state.correctAnswers || []} />
          </Box>
        </Grid>
        <Box width="300px" bgcolor="sidebar">
            <Chat messages={this.props.messages.filter((msg)=>{return msg.roomId === this.state.roomId})} />
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
