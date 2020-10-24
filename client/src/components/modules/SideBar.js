import React, { Component, useState, useEffect, } from "react";
import { withStyles } from '@material-ui/core/styles';
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Card from '@material-ui/core/Card';
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
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
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import EditName from "./EditName.js"
import ListItemText from "@material-ui/core/ListItemText";
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
    textColor: "#FFFFFF"
  },
  closeButton: {
    //position: 'absolute',
    //right: theme.spacing(1),
    //top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});
let SideBar = (props) => {
  const { classes, children, className, ...other } = props;
  
  const [leaderboard, setLeaderboard] = React.useState({})
  const [categories, setCategories] = React.useState([])
 const [editModal, setEditModal] = React.useState(false)
 const [newName, setNewName] = React.useState(props.userName)
// edit name modal
let editNameModal = <EditName open={editModal} onClose={()=>{setEditModal(false)}} title={"Change Your Name"} submitText={"Submit"} 
changeName = {props.changeName} onSubmit={()=>{}} userName={props.userName} />






  // get leaderboard again whenever our leaderboard data changes
  useEffect(() => {
    // Update the document title using the browser API
    let setData = (data, category, setCategory) => {
      let newLeaderboard = data.leaderboard
      let newCategories = data.categories
      setLeaderboard(newLeaderboard)
      setCategories(newCategories)
      if(!props.category) {
        props.setCategory(newCategories[0])
      }

     
    }
    post("api/getLeaderboard").then((data) => {

      setData(data)
    })
    socket.on("leaderboard", (data) => {
      
      setData(data)
    })

    return () => {
      socket.off("leaderboard")
    }
  }, [props.category]);
  
let rankify = (num) => {
  if(num % 10 === 1) return num+"st"
  else if(num%10 === 2) return num+"nd"
  else if(num % 10 === 3) return num+"rd"
  return num+"th"
}
  //if(!props.category || categories.length === 0 || (Object.entries(leaderboard).length === 0)) return <CircularProgress />

  let leaderboardData = {rating: 1200, highScore: 0, ratingRank: "", highScoreRank: ""}//props.userLeaderboardData.find((data)=>{return data.categoryId === props.category._id}) || {rating: 1200, highScore: 0}
  let leaderboardDataArr = undefined;
  if(props.category && leaderboard[props.category._id] ) {
    let r = leaderboard[props.category._id].topScores.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.highScore = r.score 
    r = leaderboard[props.category._id].topRatings.find((user)=>{return user.userId === props.userId})
    if(r) leaderboardData.rating = Math.floor(r.rating)

    r = leaderboard[props.category._id].topScores.findIndex((user)=>{return user.userId === props.userId})
    if(r!== -1) leaderboardData.highScoreRank = rankify(r+1)
    r = leaderboard[props.category._id].topRatings.findIndex((user)=>{return user.userId === props.userId})
    if(r !== -1) leaderboardData.ratingRank = rankify(r+1)
    
    leaderboardDataArr = {}
    for(var i=0; i<leaderboard[props.category._id].topRatings.length; i++) {
      var obj = leaderboard[props.category._id].topRatings[i]
      leaderboardDataArr[obj.userId] = {name: obj.name, rating: Math.floor(obj.rating), rank: rankify(i+1)};
    }
    for(var i=0; i<props.users.length; i++) if(!leaderboardDataArr[props.users[i].userId]) leaderboardDataArr[props.users[i].userId] = {rank: "", rating: 1200};
  }
  
  return (
    <Grid container direction="column" style={{height: "100%", maxWidth: "100%", overflow:"auto"}} >
      {editNameModal}
      {props.lobby ? <React.Fragment>
      <Typography  color="primary" component={'div'} style={{ fontFamily: "Permanent Marker", letterSpacing: "6px", width: "100%", padding: "15px 15px 15px 15px"}} align="center" variant="h4" gutterBottom>
        {"Partyy"}
      </Typography>
      <FormControl variant="filled" >
        <InputLabel id="demo-simple-select-filled-label">Game Mode</InputLabel>
        <Select
          labelId="demo-simple-select-filled-label"
          value={props.category ? ""+props.category._id : ""}
          onChange={(event)=>{
            props.setCategory(categories.find((c)=>{return c._id+""===event.target.value}))}}
        >
          {categories.map((category)=>{
            return <MenuItem value={category._id+""}>{category.name}</MenuItem>
          })}
          
        </Select>
      </FormControl>
    <Box bgcolor="userinfo">
      
      <List dense>
        <ListItem style={{marginBottom: "10px"}} key="1">
        <Typography component={'div'} style={{fontWeight: 900}} variant="h5" color="textPrimary" >
        {props.userName}

      </Typography>
      <IconButton onClick={() => {setEditModal(true)}} style={{color: "#444444"}}>
        <CreateIcon />
          </IconButton> 
      
        </ListItem>
        <ListItem key="2">
        <Typography component={'div'} variant="subtitle1" color="textSecondary" gutterBottom>
        {"Rating: "}
      </Typography>
      <ListItemSecondaryAction>
        <Grid container direction="row">
        <Typography component={'div'} variant="h6" color="textSecondary" gutterBottom>
        {leaderboardData.ratingRank}
      </Typography>
      
      <Typography component={'div'} variant="h5" color="secondary" style={{width: "75px", textAlign: "right"}} gutterBottom>
        {leaderboardData.rating}
      </Typography>
    
      
      </Grid>
      </ListItemSecondaryAction>
        </ListItem>

        <ListItem key="3">
        
        <Typography component={'div'} variant="subtitle1" color="textSecondary" gutterBottom>
        {"High Score: "}
      </Typography>
      
      <ListItemSecondaryAction>
      <Grid container direction="row">
      <Typography  component={'div'} variant="h6" color="textSecondary" gutterBottom >
        {leaderboardData.highScoreRank}
      </Typography>
      
      <Typography component={'div'} variant="h5" color="secondary" gutterBottom style={{width: "75px", textAlign: "right"}}>
        {leaderboardData.highScore}
      </Typography>
      
      </Grid>
      </ListItemSecondaryAction>
        </ListItem>
      </List>
      
      
      
     
      
    </Box>
    </React.Fragment> : <></>}
    {props.lobby ? <React.Fragment /> : <Typography component={'div'} variant="h5" color="textPrimary" gutterBottom align="center" style={{width: "100%", marginTop: "25px"}}>
                  {"Ratings"}
      </Typography>}
    {props.lobby ? <></> : 
    <List dense style={{height: "160px", overflow: "auto", margin: "0px 25px 25px 25px" }}>
      
    {props.users.sort((a,b)=>{
      if(!leaderboardDataArr) return 0; 
      let a_val = 1200;
      let b_val = 1200;
      if(leaderboardDataArr[a.userId]);
        a_val = leaderboardDataArr[a.userId].rating
      if(leaderboardDataArr[b.userId]);
        b_val = leaderboardDataArr[b.userId].rating
      return b_val-a_val;
  }).map((user)=>{
      if(!leaderboardDataArr) return <></>
      return ( <ListItem key={user.userId} selected={user.userId === props.userId}>
             
        <ListItemText primaryTypographyProps={{variant: "h6", style: user.userId === props.userId ? {fontWeight: 900} : undefined}}  primary={user.userName } />
        <ListItemSecondaryAction>
        <Grid container direction="row">
      <Typography  component={'div'} variant="h6" color="textSecondary"   >
        {leaderboardDataArr[user.userId].rank}
      </Typography>
      
      <Typography component={'div'} variant="h5" color="secondary" style={{width: "75px", textAlign: "right", fontWeight: user.userId === props.userId ? 900 : undefined}}>
          {leaderboardDataArr[user.userId].rating}
        </Typography>
      
      </Grid>
       
        </ListItemSecondaryAction>
         </ListItem>)
    })}
  </List>
  }
    <Leaderboard userId={props.userId} appbar={props.lobby} leaderboard={props.category ? leaderboard[props.category._id+""] : undefined} />
    
    </Grid>

    
    
  );
}

export default withStyles(styles)(SideBar);