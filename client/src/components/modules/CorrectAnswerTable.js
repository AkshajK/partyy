import React, { Component, useState, useEffect} from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";

import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import Typography from '@material-ui/core/Typography';
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
export default function CorrectAnswerTable(props) {
  const classes = useStyles();
  
  
  return (
    <TableContainer component={Paper} style={{maxHeight: "100%", width: "100%"}}>
      <Table className={classes.table} stickyHeader>
        <TableHead>
         
        </TableHead>
        <TableBody>
          {props.correctAnswers.map((entry) => {return (
            <StyledTableRow key={entry.userId} hover >
              <StyledTableCell component="th" scope="row">
              <Typography component={'div'} variant="h5" color="textPrimary">
                {entry.userName}
              </Typography>
              </StyledTableCell>
              <StyledTableCell align="right">
                <Typography component={'div'} variant="h5" color="primary">
                {entry.time + " sec"}
              </Typography>
              </StyledTableCell>
              <StyledTableCell align="right">
                <Typography component={'div'} variant="h5" color="primary">
                {"+"+entry.score}
              </Typography>
              </StyledTableCell>
              
            </StyledTableRow>
          )})}
        </TableBody>
        
        
      </Table>
    </TableContainer>

    
    
  );
}
