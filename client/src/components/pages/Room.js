import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";

import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import CircularProgress from "@material-ui/core/CircularProgress";

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
        users: data.users,
        category: data.category,
      });
    });
  }

  render() {
    if (!this.state.exists) return <CircularProgress />;
    return (
      <Grid container direction="row" style={{ width: "100%" }}>
        <Box width="calc(100% - 300px)">
          {"Welcome to a " + this.state.category.name + " room."}
        </Box>
        <Box width="300px">
            <Button
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
