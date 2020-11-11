import React, { Component, useState } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import CircularProgress from '@material-ui/core/CircularProgress';

import Tab from "@material-ui/core/Tab";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";

import ListItemText from "@material-ui/core/ListItemText";
import StarIcon from "@material-ui/icons/Star";

import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        props.noMargin ?
        <Typography component={'div'}>{children}</Typography> : <Box p={3}>
        <Typography component={'div'}>{children}</Typography>
      </Box>
      )}
    </div>
  );
}
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function Leaderboard(props) {
  const [value, setValue] = React.useState(0);
  //if(!props.leaderboard) return <CircularProgress />
  let leaderboard = props.leaderboard || {topScores: [], topRatings: []}
  return (
    <React.Fragment>
      {props.appbar ? <AppBar position="static" color="inherit">
        <Tabs
          value={value} 
          onChange={(event, newValue) => {
            setValue(newValue);
          }}
          aria-label="simple tabs example"
        >
          <Tab label="Top Ratings" {...a11yProps(0)} />
          <Tab label="Top Scores" {...a11yProps(1)} />
        </Tabs>
      </AppBar> : <React.Fragment />}
      {props.appbar ? <React.Fragment /> : <Typography component={'div'} variant="h5" color="textPrimary" gutterBottom align="center" style={{width: "100%"}}>
                  {"Top Scores"}
      </Typography>}
      <Box height={props.appbar ? "calc(100% - 185px)" : "calc(100% - 320px)"} style={{overflow: "auto"}}>
        {props.appbar ? 
      <TabPanel value={value} index={0}>
       
        <List dense>
          {leaderboard.topRatings.filter((arr, i)=>{return i<100}).map((entry) => {
            return (
              <ListItem key={entry.userId} selected={entry.userId === props.userId}>
             
                <ListItemText primaryTypographyProps={{variant: "h6", style: entry.userId === props.userId ? {fontWeight: 900} : null} } primary={entry.name } />
                <ListItemSecondaryAction>
                <Typography component={'div'} variant="h5" color={"secondary"} style={entry.userId === props.userId ? {fontWeight: 900} : null}>
                  {Math.floor(entry.rating)}
                </Typography>
                </ListItemSecondaryAction>
                 </ListItem>
            );
          })}
        </List>
      </TabPanel> : <React.Fragment />}
      <TabPanel value={value} index={props.appbar ? 1 : 0} style={props.appbar ? undefined : {padding: "0px 25px 25px 25px"}}noMargin={props.appbar ? false : true}>
     
      <List dense>
      {leaderboard.topScores.filter((arr, i)=>{return i<100}).map((entry) => {
            return (
              <ListItem key={entry.userId} selected={entry.userId === props.userId}>
                <ListItemText primaryTypographyProps={{variant: "h6", style: entry.userId === props.userId ? {fontWeight: 900} : null}} primary= {entry.name } />
                <ListItemSecondaryAction>
                <Typography component={'div'} variant="h5" color="secondary" style={entry.userId === props.userId ? {fontWeight: 900} : null}>
                  {entry.score}
                </Typography>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
          </List>
         
      </TabPanel>
    </Box>
    </React.Fragment>
  );
}
