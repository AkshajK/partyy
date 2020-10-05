import React, { Component } from "react";

import "../../utilities.css";
import { socket } from "../../client-socket.js";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import PersonIcon from "@material-ui/icons/Person";
import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import RoomTable from "../modules/RoomTable.js"
import Chat from "../modules/Chat.js"
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
      
      console.log(data.users)
      this.props.resetMessages()
      this.setState({
        doneLoading: true,
        users: data.users.concat([]),
        rooms: data.rooms.concat([]),
        messages: data.messages.concat([])
      });
    });

    socket.on("createdRoom", (room)=>{
      let rooms = this.state.rooms
      rooms.push(room)
      this.setState({rooms: rooms})
    })

    socket.on("joinRoomLobby", (data)=>{
      console.log("SOMEONEJOIINEDAROOM")
      console.log(data)
      let rooms = this.state.rooms 
      console.log(rooms)
      let newRoom = rooms.find((room)=>{return room._id === data.roomId})
      newRoom.users = newRoom.users.concat([data.userId])

      this.setState({rooms: rooms})
    })

    socket.on("leftRoomLobby", (data)=>{
      let rooms = this.state.rooms 
      let newRoom = rooms.find((room)=>{return room._id === data.roomId})
      newRoom.users = newRoom.users.filter((id)=>{return id !== data.userId})
      
      this.setState({rooms: rooms})
    })

    socket.on("joinedLobby", (data)=>{
      let users = this.state.users 
      users.push(data)
      this.setState({users: users})
    })

    socket.on("leftLobby", (data)=>{
      let users = this.state.users.filter((user)=>{return user.userId !== data.userId})
      this.setState({users: users})
    })
  }
  componentWillUnmount() {
    socket.off("createdRoom")
    socket.off("joinRoomLobby")
    socket.off("leftRoomLobby")
    socket.off("joinedLobby")
    socket.off("leftLobby")
    
  }
  
  /*componentDidUpdate(prevProps) {
    if(this.props.url !== prevProps.url) // Check if it's a new user, you can also use some unique property, like the ID  (this.props.user.id !== prevProps.user.id)
    {
      this.componentDidMount();
    }
  } */
  
  render() {
    if (!this.state.doneLoading) return <CircularProgress />;
    console.log("render rooms")
    console.log(this.state.rooms)

    return (
      
        
        <Grid container direction="row" style={{ width: "100%", height: "100%" }}>
        <Box width="calc(100% - 300px)" height="100%" style={{padding: "40px"}}>
          <RoomTable users={this.state.users} rooms={this.state.rooms} redirect={this.props.redirect} />
        </Box>
        <Box width="300px" height="100%" bgcolor="sidebar">
          <List>
            {this.state.users.map((user)=>{
              return (<ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary={user.userName} /></ListItem>)
            })}
          </List>
          <Chat messages={this.state.messages.concat(this.props.messages)} />
          {this.props.category ? <Button fullWidth onClick={
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
