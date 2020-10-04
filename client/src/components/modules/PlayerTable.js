import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";

import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
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
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 150,
  },
});
export default function PlayerTable(props) {
  const classes = useStyles();
  
  let score = 0
  if (props.players) {
    let player = props.players.find((player)=>{player.userId === user.userId}) 
    if(player) [
      score = player.score
    ]
  }
 
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <StyledTableCell>Player</StyledTableCell>
            <StyledTableCell align="right">Score</StyledTableCell>
            
          </TableRow>
        </TableHead>
        <TableBody>
          {props.users.map((user) => (
            <StyledTableRow key={user.userId} hover >
              <StyledTableCell component="th" scope="row">
                {user.userName}
              </StyledTableCell>
              <StyledTableCell align="right">{
                score
              }</StyledTableCell>
              
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    
    
  );
}
