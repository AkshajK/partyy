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
        <Box p={3}>
          <Typography>{children}</Typography>
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
  if(!props.leaderboard) return <CircularProgress />
  return (
    <>
      <AppBar position="static" color="inherit">
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
      </AppBar>
      <TabPanel value={value} index={0}>
        <p>Top Ratings:</p>
        <List>
          {props.leaderboard.topRatings.map((entry) => {
            return (
              <ListItem>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText primary={entry.name + ": " + Math.floor(entry.rating)} />
              </ListItem>
            );
          })}
        </List>
      </TabPanel>
      <TabPanel value={value} index={1}>
      <p>Top Scores:</p>
      {props.leaderboard.topScores.map((entry) => {
            return (
              <ListItem>
                <ListItemIcon>
                  <StarIcon />
                </ListItemIcon>
                <ListItemText primary={entry.name + ": " + entry.score} />
              </ListItem>
            );
          })}
      </TabPanel>
    </>
  );
}
