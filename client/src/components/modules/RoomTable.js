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
const formatDate = (duedate) => {
  return (
    new Date(duedate.toString()).toString().substring(0, 11) +
    new Date(duedate.toString()).toLocaleString([], { hour: "2-digit", minute: "2-digit" })
  );
  // duedate.toString().substring(0, 11) + duedate.toString().substring(16, 21);
};
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
    minWidth: 700,
    
  },
});
export default function RoomTable(props) {
  const classes = useStyles();
  
  
  return (
    <TableContainer component={Paper} style={{height: "100%", width: "100%"}}>
      <Table className={classes.table} aria-label="customized table" stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell>Host</StyledTableCell>
            <StyledTableCell align="right">Players</StyledTableCell>
            <StyledTableCell align="right">Game Mode</StyledTableCell>
            <StyledTableCell align="right">Status</StyledTableCell>
            <StyledTableCell align="right">Created</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.rooms.map((room) => (
            <StyledTableRow key={room.name} hover onClick={()=>{
              post("api/leaveLobby",{}).then(()=>{
                props.redirect("/"+room.name)
              })
              }}>
              <StyledTableCell component="th" scope="row">
                {room.host.name}
              </StyledTableCell>
              <StyledTableCell align="right">{room.users.length}</StyledTableCell>
              <StyledTableCell align="right">{room.category.name}</StyledTableCell>
              <StyledTableCell align="right">{room.closed ? "Completed" : room.status === "Finished" ? "Waiting" : room.status }</StyledTableCell>
              <StyledTableCell align="right">{formatDate(room.created)}</StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    
    
  );
}
