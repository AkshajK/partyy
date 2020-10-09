import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Card from '@material-ui/core/Card';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import TextField from "@material-ui/core/TextField"
import DialogTitle from "@material-ui/core/DialogTitle";
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';

import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { socket } from "../../client-socket.js";
import CreateIcon from '@material-ui/icons/Create';
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
 const [editModal, setEditModal] = React.useState(false)
 const [newName, setNewName] = React.useState(props.userName)
// edit name modal
let editNameModal = (
  <>
    <Dialog open={editModal} onClose={()=>{setEditModal(false)}}>
      <DialogTitle>Change Your Name</DialogTitle>
      <DialogContent>
       
        <TextField
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          value={newName}
          onChange={(event) => {
           setNewName(event.target.value);
          }}
        />
       
       
      </DialogContent>
      <DialogActions>
        <Button
          onClick={()=>{
            post("api/changeName", {name: newName}).then(()=>{
            props.changeName(newName)
            setEditModal(false)
          })}
        }
         
          color="primary"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  </>
);





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
      if(!props.category) props.setCategory(newCategories[0])
      
      
      console.log("REPULLED LEADERBOARD DATA!")
    }
    post("api/getLeaderboard").then((data) => {
      setData(data)
    })
    socket.on("leaderboard", (data) => {
      setData(data)
    })
  }, []);
  
let rankify = (num) => {
  if(num % 10 === 1) return num+"st"
  else if(num%10 === 2) return num+"nd"
  else if(num % 10 === 3) return num+"rd"
  return num+"th"
}
  //if(!props.category || categories.length === 0 || (Object.entries(leaderboard).length === 0)) return <CircularProgress />
console.log(leaderboard)
  let leaderboardData = {rating: 1200, highScore: 0, ratingRank: "", highScoreRank: ""}//props.userLeaderboardData.find((data)=>{return data.categoryId === props.category._id}) || {rating: 1200, highScore: 0}
  if(props.category && leaderboard[props.category._id] ) {
    let r = leaderboard[props.category._id].topScores.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.highScore = r.score 
    r = leaderboard[props.category._id].topRatings.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.rating = Math.floor(r.rating)

    r = leaderboard[props.category._id].topScores.findIndex((user)=>{return user.userId === props.userId})
    if(r!== -1) leaderboardData.highScoreRank = rankify(r+1)
    r = leaderboard[props.category._id].topRatings.findIndex((user)=>{return user.userId === props.userId})
    if(r !== -1) leaderboardData.ratingRank = rankify(r+1)
    
  }
  return (
    <Grid container direction="column" style={{height: "100%", maxWidth: "100%", overflow:"auto"}} >
      {editNameModal}
      <Typography  style={{fontWeight: 900, fontFamily: "Permanent Marker", width: "100%", padding: "20px 20px 20px 20px"}} align="center" variant="h4" color="textPrimary" gutterBottom>
        {"Partyy.Life 2.0"}
      </Typography>
      <FormControl variant="filled" >
        <InputLabel id="demo-simple-select-filled-label">Game Mode</InputLabel>
        <Select
          labelId="demo-simple-select-filled-label"
          value={props.category ? ""+props.category._id : ""}
          onChange={(event)=>{props.setCategory(categories.find((c)=>{return c._id+""===event.target.value}))}}
        >
          {categories.map((category)=>{
            return <MenuItem value={category._id+""}>{category.name}</MenuItem>
          })}
          
        </Select>
      </FormControl>
    <Box bgcolor="userinfo">
      
      <List dense>
        <ListItem style={{marginBottom: "10px"}}>
        <Typography style={{fontWeight: 900}} variant="h5" color="textPrimary" >
        {props.userName}

      </Typography>
      <IconButton onClick={() => {setEditModal(true)}} style={{color: "#222222"}}>
        <CreateIcon />
          </IconButton> 
      
        </ListItem>
        <ListItem>
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {"Rating: "}
      </Typography>
      <ListItemSecondaryAction>
        <Grid container direction="row">
        <Typography variant="h6" color="textSecondary" gutterBottom>
        {leaderboardData.ratingRank}
      </Typography>
      
      <Typography variant="h5" color="primary" style={{width: "75px", textAlign: "right"}} gutterBottom>
        {leaderboardData.rating}
      </Typography>
    
      
      </Grid>
      </ListItemSecondaryAction>
        </ListItem>

        <ListItem>
        
        <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {"High Score: "}
      </Typography>
      
      <ListItemSecondaryAction>
      <Grid container direction="row">
      <Typography variant="h6" color="textSecondary" gutterBottom >
        {leaderboardData.highScoreRank}
      </Typography>
      
      <Typography variant="h5" color="primary" gutterBottom style={{width: "75px", textAlign: "right"}}>
        {leaderboardData.highScore}
      </Typography>
      
      </Grid>
      </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      
      
     
      
    </Box>
    <Box height="calc(100% - 320px)" style={{overflow: "auto"}}>
      
    <Leaderboard leaderboard={props.category ? leaderboard[props.category._id+""] : undefined} />
    </Box>
    </Grid>

    
    
  );
}
