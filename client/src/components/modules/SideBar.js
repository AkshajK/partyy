import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Leaderboard from "./Leaderboard.js"
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

export default function SideBar(props) {
  
  const [leaderboard, setLeaderboard] = React.useState({})
  const [categories, setCategories] = React.useState([])

  // get leaderboard again whenever our leaderboard data changes
  useEffect(() => {
    // Update the document title using the browser API
    post("api/getLeaderboard").then((data) => {
      let newLeaderboard = data.leaderboard
      let newCategories = data.categories
      console.log(newLeaderboard)
      console.log(newCategories)
      
      setLeaderboard(newLeaderboard)
      setCategories(newCategories)
      props.setCategory(newCategories[0])
      
      
      console.log("REPULLED LEADERBOARD DATA!")
    })
  }, [props.userLeaderboardData]);
  
  //if(!props.category || categories.length === 0 || (Object.entries(leaderboard).length === 0)) return <CircularProgress />

  let leaderboardData = props.userLeaderboardData.find((data)=>{return data.categoryId === props.category._id}) || {rating: 1200, highScore: 0}
  return (
    <Grid container direction="column">
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
    <Card>
      <CardContent>
      <Typography variant="subtitle1" gutterBottom>
        {props.userName}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {"Rating: " + leaderboardData.rating}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
      {"High Score: " + leaderboardData.highScore} 
      </Typography>
      </CardContent>
      
    </Card>
    <Leaderboard leaderboard={props.category ? leaderboard[props.category._id] : undefined} />
    </Grid>

    
    
  );
}
