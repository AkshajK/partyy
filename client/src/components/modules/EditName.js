import React, { Component, useState, useEffect, } from "react";
import { withStyles } from '@material-ui/core/styles';
import Button from "@material-ui/core/Button"
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import TextField from "@material-ui/core/TextField"

import { socket } from "../../client-socket.js";

import Typography from '@material-ui/core/Typography';

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
let EditName = (props) => {
  const { classes, children, className, ...other } = props;
  
 const [newName, setNewName] = React.useState(props.userName)
// edit name modal
return (
  <>
    <Dialog open={props.open} onClose={props.onClose}>
      <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography component={'div'} variant="h6" color="textPrimary">{props.title}</Typography></MuiDialogTitle>
      <MuiDialogContent>
       
        <TextField
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          value={newName}
          onChange={(event) => {
           setNewName(event.target.value.substring(0, 15));
          }}
        />
       
       
      </MuiDialogContent>
      <MuiDialogActions>
        <Button className={classes.closeButton}
          onClick={()=>{
            post("api/changeName", {name: newName}).then(()=>{
            props.changeName(newName)
            props.onSubmit()
            props.onClose()
          })}
        }
         
          color="primary"
        >
          {props.submitText}
        </Button>
      </MuiDialogActions>
    </Dialog>
  </>



    
    
  );
}

export default withStyles(styles)(EditName);