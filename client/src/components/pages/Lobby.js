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
import Typography from "@material-ui/core/Typography";
import RoomTable from "../modules/RoomTable.js"
import Chat from "../modules/Chat.js"
import { get, post } from "../../utilities.js";
class Lobby extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      buttonColor: "#2e7d32"
    };
  }

  componentDidMount() {
    // remember -- api calls go here!
    if(!this.props.mobile) this.props.setShowSidebar(true);
    post("api/joinLobby", {}).then((data) => {
      if(data.disconnect) {
        this.props.error();
        return;
      }

      this.props.resetMessages()
      this.setState({
        doneLoading: true,
        users: data.users.concat([]),
        rooms: data.rooms.concat([]),
        messages: data.messages.concat([])
      });
    });
    /*
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
    */

    socket.on("joinedLobby", (data)=>{
      let users = this.state.users 
      users.push(data)
      this.setState({users: users})
    })

    socket.on("room", (room) => {
      let rooms = this.state.rooms.filter((rm)=>{return rm._id+"" !== room._id+""})
      rooms.push(room)
      this.setState({rooms: rooms})

    })

    socket.on("leftLobby", (data)=>{
      let users = this.state.users.filter((user)=>{return user.userId !== data.userId})
      this.setState({users: users})
    })
    socket.on("changeName", (user)=>{
      let users = this.state.users 
      let filtered = users.filter((u)=>{return u.userId !== user.userId})
      if(users.length !== filtered.length) {
        filtered.push(user);
        this.setState({users: filtered});
      }
    })
    this.props.setLobby(true);
  }
  componentWillUnmount() {
   // socket.off("createdRoom")
   // socket.off("joinRoomLobby")
   // socket.off("leftRoomLobby")
   socket.off("room")
    socket.off("joinedLobby")
    socket.off("leftLobby")
    socket.off("changeName");
    
  }
  
  /*componentDidUpdate(prevProps) {
    if(this.props.url !== prevProps.url) // Check if it's a new user, you can also use some unique property, like the ID  (this.props.user.id !== prevProps.user.id)
    {
      this.componentDidMount();
    }
  } */
  
  render() {
    if (!this.state.doneLoading) return <CircularProgress />;
  
    let rightbar = this.props.width > 1000;
    return (
      
        
        <Grid container direction="row" style={{ width: "100%", height: "100%", overflow:"auto" }}>
        <Box width={rightbar ? "calc(100% - 320px)" : "100%" } height="100%" style={{padding: "30px 40px 40px 40px"}}>
          <Box height="50px" style={{display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "10px"}}>
          {this.props.category ? 
          <React.Fragment>

            <Grid container direction="row" spacing={1}>
              <Grid item xs={6}>
              <Button fullWidth style={{backgroundColor: this.state.buttonColor, color: "#FFFFFF"}} onMouseOver={()=>{this.setState({buttonColor:"#43a047"})}} onMouseOut={()=>{this.setState({buttonColor:"#2e7d32"})}} variant="contained" onClick={
            () => {
            post("api/createRoom", {categoryId: this.props.category._id}).then((data) => {
              this.props.redirect("/"+data.name)
            })
            }
          }>
   <Typography noWrap variant="button"> New {this.props.category.name} Game </Typography>
          </Button> 
              </Grid>
              <Grid item xs={6}>
              <Button fullWidth color="secondary" variant="outlined" onClick={
            () => {
            post("api/createRoom", {categoryId: this.props.category._id, private: true}).then((data) => {
              this.props.redirect("/"+data.name)
            })
            }
          }>
            <Typography noWrap variant="button"> Private Game </Typography>
    
          </Button> 
              </Grid>
            </Grid>
          
          
          </React.Fragment>: <></>}
          </Box>
          <Box height={this.props.login ? "calc(100% - 70px)" : "calc(100% - 50px)"} style={{marginBottom: this.props.login ? "10px" : undefined}}>
          <RoomTable users={this.state.users} rooms={this.state.rooms} redirect={this.props.redirect} categoryId={this.props.category ? this.props.category._id : undefined} />
          </Box>
          {this.props.login || <></>}
        </Box>
        {rightbar ? 
        <Box width="320px" height="100%" style={{overflow: "auto"}} bgcolor="sidebar" >
          {this.props.userInfo}
          {/*<List style={{maxHeight: "300px", overflow: "auto"}}>
            {this.state.users.map((user)=>{
              return (<ListItem key={user.userId}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primaryTypographyProps={{variant: "h6", style: user.userId === this.props.userId ? {fontWeight: 900} : null} }  primary={user.userName} /></ListItem>)
            })}
          </List>*/}
          <Box width="100%" height="calc(100% - 205px)" >
          <Chat lobby={true} messages={this.state.messages.concat(this.props.messages)} />
          </Box>
          
        </Box> : <React.Fragment />}
      </Grid>
        
      
    );
  }
}

export default Lobby;
