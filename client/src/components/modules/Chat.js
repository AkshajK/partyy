import React, { Component, useState, useEffect } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip"
import ListItemText from "@material-ui/core/ListItemText";
import {  notification, Space } from 'antd';
import "../../utilities.css";

//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";
/*
(props.categoryName && props.messages.length === 0 ? [{style: "welcome", message: "This is a " + props.categoryName + " room"}, {style: "welcome", message: "Guess the title or artist, or type \'skip\' to skip."}] : []).concat(
  */
export default function Chat(props) {
  
  let crop = (str) => {
    if (str.length > 140) {
      str = str.substring(0, 140);
    }
    return str;
  };
  let getLastFew = (number, array) => {
    let sortedArray = array.sort((a,b) => {new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()})
    let newArray = [];
    for (var i = Math.max(array.length - number, 0); i < array.length; i++) {
      newArray.push(array[i]);
    }
    return newArray;
  };
  let addZero = (i) => {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }
  const [messageText, setMessageText] = React.useState("");
  const [lastMessage, setLastMessage] = React.useState(new Date());

  const formatDate = (duedate) => {
    
    return (
      new Date(duedate).toString().substring(0, 11) +
      new Date(duedate).toLocaleString([], { hour: "2-digit", minute: "2-digit" })
    );
    
    
  };
  return (
    <Paper style={{ borderRadius: "0px", height: props.lobby ? "100%" : (props.mobile ? "100%" : "calc(100% - 420px)"), paddingTop: "10px"}} >
      <Box
        height={"calc(100% - 40px)"}
        style={{
          width: "100%",
          overflow: "auto",
          //color: "black",
          display: "flex",
          flexDirection: "column-reverse",
          marginBottom: "auto",
        }}
      >
        <List>
          {getLastFew(
            50,
            props.messages
          ).map((message) => {
            let text = ""
            if (message.style==="system message") {
              text = message.message;
            }
            else if (message.style === "correct answer") {
                text = (
                  <div style={{ color: "#78cb48", display: "inline", fontWeight: "900" }}>
                    {message.message}
                  </div>
                );
              }
              else if (message.style === "correct artist") {
                text = (
                  <div style={{ color: "#e25141", display: "inline", fontWeight: "900" }}>
                    {message.message}
                  </div>
                );
              }
              else if (message.style === "skip") {
                text = (
                  <div style={{ color: "#4595EC", display: "inline", fontWeight: "900" }}>
                    {message.message}
                  </div>
                );
              }
              else if (message.style === "welcome") {
                text = (
                  <div style={{ color: "#A0A0A0", display: "inline", fontWeight: "900" }}>
                    {message.message}
                  </div>
                );
              }
            
            else {
             text = (
                
                  <>
                  <div style={{ color: "#4595EC", display: "inline", fontWeight: "900" }}>
                    {message.sender.name}
                  </div>
                  <div style={{ display: "inline" }}>{": " + crop(message.message)}</div>
                  </>
               
              );
            }

            return (
              
              <ListItem dense fullWidth key={message._id}>
                <Tooltip title={formatDate(message.timestamp)}>
                <ListItemText>{text}</ListItemText>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <TextField
        label={props.inGame ? "Guess" : "Message"}
        color={props.inGame ? "secondary" : "primary"}
        variant="outlined"
        size="small"
        value={messageText}
        fullWidth
        onChange={(event) => {
          setMessageText(event.target.value);
        }}
        onKeyPress={(event) => {
          if (event.charCode === 13) {
            if (new Date().getTime() - new Date(lastMessage).getTime() >= 500) {
              setLastMessage(new Date());
              event.preventDefault();

              post("api/message", {
                text: messageText,
              }).then((e)=>{
                if(e.error) this.props.error();
              })
              setMessageText("");
              

            }
          }
        }}
      />
    </Paper>
  );
}
