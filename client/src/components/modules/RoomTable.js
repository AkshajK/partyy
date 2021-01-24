import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import ReplayIcon from '@material-ui/icons/Replay';
import MusicNoteIcon from '@material-ui/icons/MusicNote';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import Tooltip from "@material-ui/core/Tooltip"
import Typography from '@material-ui/core/Typography';
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
  const seconds = Math.floor((new Date().getTime() - new Date(duedate).getTime())/1000);
  if (seconds < 60) return seconds + (seconds===1?" sec ago":" sec ago")
  const minutes = Math.floor(seconds/60)
  if (minutes < 60) return minutes + (minutes===1?" min ago":" min ago")
  const hours = Math.floor(minutes/60)
  if (hours < 24) return hours + (hours===1?" hour ago":" hours ago")
  const days = Math.floor(hours/24)
  return days + (days===1?" day ago":" days ago")
};
const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#1264e3",
    color: theme.palette.common.white,
    fontWeight: 900,
    fontSize: 14,
    
  },
  body: {
    fontSize: 18,
    overflow: "auto",
    whiteSpace: "nowrap"

    
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  /*root: {
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.action.hover,
    },
    
    '&:nth-of-type(even)': {
      backgroundColor: theme.palette.action.hover,
    },
  },*/
}))(TableRow);

const useStyles = makeStyles({
  table: {
    minWidth: 300,
    
  },
});
export default function RoomTable(props) {
  const classes = useStyles();
  const [disable, setDisable] = React.useState(false);
  
  return (
    <TableContainer component={Paper} style={{height: "100%", width: "100%"}}>
      <Table className={classes.table} aria-label="customized table" stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell>Host</StyledTableCell>
            <StyledTableCell align="right">Players</StyledTableCell>
            <StyledTableCell align="right">Mode</StyledTableCell>
            <StyledTableCell align="right">Last Active</StyledTableCell>
            <StyledTableCell align="right">Status</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.rooms.sort((a,b)=>{
            if(a.users.length > 0 && b.users.length === 0) return -1;
            if(b.users.length > 0 && a.users.length === 0) return 1;
            return new Date(b.created).getTime()- new Date(a.created).getTime()
          }).map((room) => {
            let iconText = room.closed ? "Completed" : room.status === "Finished" ? "Waiting" : (room.status === "InProgress" ? "In Progress" : room.status);
            let icon = iconText === "In Progress" ? <MusicNoteIcon /> : <ReplayIcon />
            return  (
            <StyledTableRow key={room.name} hover onClick={()=>{
              if(disable) return;
              setDisable(true)
              post("api/leaveLobby",{}).then(()=>{
                props.redirect("/"+room.name)
                setDisable(false)
              })
              }}>
              <StyledTableCell component="th" scope="row">
              <Typography component={'div'} variant="h6" color="primary" style={{fontWeight: 900}}>
              {room.host.name}
                </Typography>
                
              </StyledTableCell>
              <StyledTableCell align="right">
              <Typography component={'div'} variant="h5" color="secondary" style={{fontWeight: 900}}>
              {room.users.length}
                </Typography>
              
              </StyledTableCell>
              <StyledTableCell align="right">{room.category.name}</StyledTableCell>
              <StyledTableCell align="right">{formatDate(room.created)}</StyledTableCell>
              <StyledTableCell align="right"><Tooltip title={iconText}>{icon}</Tooltip></StyledTableCell>
              
            </StyledTableRow>
            )})}
        </TableBody>
      </Table>
    </TableContainer>

    
    
  );
}
