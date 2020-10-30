import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";

import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import Typography from "@material-ui/core/Typography";
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  body: {
    fontSize: 14,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    "&.Mui-selected": {
      backgroundColor: theme.palette.action.hover
    }
  }
  /*
  root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },*/
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 150,

  },

});
export default function PlayerTable(props) {
  const classes = useStyles();
  
  let score = (user) => {
  if (props.players) {
    let player = props.players.find((player)=>{return player.userId === user.userId}) 
    if(player) {
      return player.score
    }
    
  }
  return 0
  }


  return (
    <TableContainer component={Paper} style={{maxHeight: "100%", width: "100%"}}>
      <Table className={classes.table} stickyHeader>
        <TableHead>
         
        </TableHead>
        <TableBody>
          {props.users.map((user)=>{return Object.assign(user, {score: score(user)})}).sort((a,b)=>{return b.score-a.score}).map((user) => (
            <StyledTableRow key={user.userId} hover selected={props.userId === user.userId} >
              <StyledTableCell component="th" scope="row">
              <Typography component={'div'} variant="h5" color="textPrimary">
                {user.userName}
              </Typography>
              </StyledTableCell>
              <StyledTableCell align="right">
                <Typography component={'div'} variant="h4" color="primary" style={{fontWeight: 900}}>
                {user.score}
              </Typography>
                
              </StyledTableCell>
              
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    
    
  );
}
