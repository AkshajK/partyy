import React, { Component } from "react";
import {  notification, Space } from 'antd';
import "../../utilities.css";
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";

import ListItemText from "@material-ui/core/ListItemText";
import TextField from "@material-ui/core/TextField";

import { post, get,  } from "../../utilities.js";


class BotDashboard extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      name: "",
      messageText: "",
      difficulty: ""
    };
  }

  componentDidMount() {
    post("api/joinBotDashboard", {}).then((data) => {
      this.setState({bots: data.bots, rooms: data.rooms}, () => {
        if(this.state.bot) {
          this.setState({bot: (this.state.bots.find((b)=>{return b._id+""===this.state.bot._id}))})
        }
      });
      
    })
  }
  formatDate(duedate) {
    const seconds = Math.floor((new Date().getTime() - new Date(duedate).getTime())/1000);
    if (seconds < 60) return seconds + (seconds===1?" second ago":" seconds ago")
    const minutes = Math.floor(seconds/60)
    if (minutes < 60) return minutes + (minutes===1?" minute ago":" minutes ago")
    const hours = Math.floor(minutes/60)
    if (hours < 24) return hours + (hours===1?" hour ago":" hours ago")
    const days = Math.floor(hours/24)
    return days + (days===1?" day ago":" days ago")
  }
  render() {
    if(!this.state.bots || !this.state.rooms) return <h1>Loading</h1>

    return (
      <div style={{height: "100%", width: "100%", overflow: "auto", padding: "20px 20px 20px 20px"}}>
        
        <Typography component={'div'} variant="h3" color="textPrimary">
                {"Bot Dashboard"}
              </Typography>
    <TextField
        label="Bot Name"
        variant="outlined"
     
        value={this.state.name}
        fullWidth
        onChange={(event) => {
          this.setState({name: (event.target.value)});
        }}
        
        
      />
<TextField
        label="Difficulty Level"
        variant="outlined"
   
        value={this.state.difficulty}
        fullWidth
        onChange={(event) => {
          
          this.setState({difficulty: event.target.value});
        }}
        onKeyPress={(event) => {
          if (event.charCode === 13) {
            if(isNaN(parseInt(this.state.difficulty))) return;
           

              post("api/addBot", {
               name: this.state.name, difficulty: parseInt(this.state.difficulty)
              }).then((data1)=>{
                this.componentDidMount();
              })
              this.setState({difficulty: "", name: ""});

            
          }
        }}
      />
      <Grid container direction="row" style={{width: "calc(100% - 40px)", height: "100%"}}>
      <Select
          labelId="demo-simple-select-filled-label"
          value={this.state.bot ? this.state.bot._id : ""}
          onChange={(event)=>{
            if(!this.state.bots) return;
            this.setState({bot: (this.state.bots.find((b)=>{return b._id+""===event.target.value}))})}}
        >
          {this.state.bots.map((bot)=>{
            return <MenuItem value={bot._id+""}>{bot.name}</MenuItem>
          })}
          
        </Select>
        <Box width={1} style={{height: "100%", overflow: "auto"}}>
          <Button disabled={!this.state.bot || (this.state.bot.roomId !== "Offline")} onClick={()=>{post("api/deleteBot", {botId: this.state.bot._id}).then(() => {
            this.componentDidMount();
            this.setState({bot: undefined})
          })}}>{"Delete " + (this.state.bot ? this.state.bot.name : "")}</Button>
          <List>
        {
          
        this.state.rooms.map((room) => {
          return (
            <>
            <ListItem>
              <ListItemText disableTypography>
          <Typography component={'div'} variant="h4" color="primary">
          {room.host.name + " (" + room.users.length + " players), created " + this.formatDate(room.created)}
              </Typography>
              </ListItemText>
              <ListItemSecondaryAction>
                <Button disabled={!this.state.bot || (this.state.bot.roomId !== "Offline")} onClick={() => {post("api/botJoinRoom", {name: room.name, botId: this.state.bot ? this.state.bot._id : ""}).then(()=>{
                  this.componentDidMount();
                })}}>Join</Button>
                <Button disabled={!this.state.bot || (this.state.bot.roomId !== (room._id+""))} onClick={() => {post("api/botLeaveRoom", {roomId: room._id, botId: this.state.bot ? this.state.bot._id : ""}).then(()=>{
                  this.componentDidMount();
                })}}>Leave</Button>
              </ListItemSecondaryAction>
              </ListItem>
          
          </>
          )
          
        })
      }
      </List>
        </Box>
        
      </Grid>
      



        
      </div>
    );
  }
}

export default BotDashboard;
