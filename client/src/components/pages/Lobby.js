import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";

import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import RoomTable from "../modules/RoomTable.js"
import { get, post } from "../../utilities.js";
class Lobby extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {};
  }

  componentDidMount() {
    // remember -- api calls go here!
    post("api/joinLobby", {}).then((data) => {
      
      
      this.setState({
        doneLoading: true,
        users: data.users,
        rooms: data.rooms,
        messages: data.messages
      });
    });
  }

  render() {
    if (!this.state.doneLoading) return <CircularProgress />;

    return (
      
        
        <Grid container direction="row" style={{ width: "100%" }}>
        <Box width="calc(100% - 300px)">
          <RoomTable users={this.state.users} rooms={this.state.rooms} redirect={this.props.redirect} />
        </Box>
        <Box width="300px">
          {this.props.category ? <Button onClick={
            () => {
            post("api/createRoom", {categoryId: this.props.category._id}).then((data) => {
              this.props.redirect("/"+data.name)
            })
            }
          }>
    New {this.props.category.name} Game
          </Button> : <></>}
        </Box>
      </Grid>
        
      
    );
  }
}

export default Lobby;