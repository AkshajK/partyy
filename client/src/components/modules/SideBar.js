import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { socket } from "../../client-socket.js";

import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Leaderboard from "./Leaderboard.js"
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";

import ListItemText from "@material-ui/core/ListItemText";
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

export default function SideBar(props) {
  
  const [leaderboard, setLeaderboard] = React.useState({})
  const [categories, setCategories] = React.useState([])

  // get leaderboard again whenever our leaderboard data changes
  useEffect(() => {
    // Update the document title using the browser API
    let setData = (data) => {
      let newLeaderboard = data.leaderboard
      let newCategories = data.categories
      console.log(newLeaderboard)
      console.log(newCategories)
      
      setLeaderboard(newLeaderboard)
      setCategories(newCategories)
      props.setCategory(newCategories[0])
      
      
      console.log("REPULLED LEADERBOARD DATA!")
    }
    post("api/getLeaderboard").then((data) => {
      setData(data)
    })
    socket.on("leaderboard", (data) => {
      setData(data)
    })
  }, []);
  
  //if(!props.category || categories.length === 0 || (Object.entries(leaderboard).length === 0)) return <CircularProgress />

  let leaderboardData = {rating: 1200, highScore: 0}//props.userLeaderboardData.find((data)=>{return data.categoryId === props.category._id}) || {rating: 1200, highScore: 0}
  if(props.category && leaderboard[props.category._id] ) {
    let r = leaderboard[props.category._id].topScores.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.highScore = r.score 
    r = leaderboard[props.category._id].topRatings.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.rating = Math.floor(r.rating)
    
  }
  return (
    <Grid container direction="column">
      <Typography style={{fontWeight: 900, fontFamily: "Permanent Marker", margin: "20px 20px 20px 20px"}} align="center" variant="h4" color="textPrimary" gutterBottom>
        {"Partyy.Life 2.0"}
      </Typography>
      <FormControl variant="filled" >
        <InputLabel id="demo-simple-select-filled-label">Game Mode</InputLabel>
        <Select
          labelId="demo-simple-select-filled-label"
          value={props.category || ""}
          onChange={(event)=>{props.setCategory(event.target.value)}}
        >
          {categories.map((category)=>{
            return <MenuItem value={category}>{category.name}</MenuItem>
          })}
          
        </Select>
      </FormControl>
    <Box bgcolor="userinfo">
      
      <List dense>
        <ListItem>
        <Typography style={{fontWeight: 900}} variant="h5" color="textPrimary" gutterBottom>
        {props.userName}
      </Typography>
        </ListItem>
        <ListItem>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {"Rating: "}
      </Typography>
      <ListItemSecondaryAction>
      <Typography variant="h5" color="primary" gutterBottom>
        {leaderboardData.rating}
      </Typography>
      </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {"High Score: "}
      </Typography>
      <ListItemSecondaryAction>
      <Typography variant="h5" color="primary" gutterBottom>
        {leaderboardData.highScore}
      </Typography>
      </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      
      
     
      
    </Box>
    <Leaderboard leaderboard={props.category ? leaderboard[props.category._id] : undefined} />
    </Grid>

    
    
  );
}
