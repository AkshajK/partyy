import React, { Component, useState } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Leaderboard from "./Leaderboard.js"
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

export default function SideBar(props) {
  return (
    <Grid container direction="column">
    <Paper>
      <Typography variant="subtitle1" gutterBottom>
        {props.userName}
      </Typography>
    </Paper>
    <Leaderboard />
    </Grid>

    
    
  );
}
