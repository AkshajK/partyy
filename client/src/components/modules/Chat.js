import React, { Component, useState, useEffect } from "react";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import ListItemText from "@material-ui/core/ListItemText";
import "../../utilities.css";
//import { redirectPage } from "@reach/router";

import { get, post } from "../../utilities.js";

export default function Chat(props) {
  let crop = (str) => {
    if (str.length > 140) {
      str = str.substring(0, 140);
    }
    return str;
  };
  let getLastFew = (number, array) => {
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

  return (
    <Paper style={{ borderRadius: "0px"}}>
      <Box
        height={"300px"}
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
            let text = (
              <>
                <div style={{ display: "inline" }}>
                  {"[" +
                    addZero(new Date(message.timestamp).getHours()) +
                    ":" +
                    addZero(new Date(message.timestamp).getMinutes()) +
                    "] "}
                </div>
                <div style={{ color: "#678efd", display: "inline", fontWeight: "900" }}>
                  {message.sender.name}
                </div>
                <div style={{ display: "inline" }}>{": " + crop(message.message)}</div>
              </>
            );
            if (message.systemMessage) {
              text = message.message;
              if (message.style === "correct answer") {
                text = (
                  <div style={{ color: "#78cb48", display: "inline", fontWeight: "900" }}>
                    {message.message}
                  </div>
                );
              }
            }

            return (
              <ListItem dense fullWidth>
                <ListItemText>{text}</ListItemText>
              </ListItem>
            );
          })}
        </List>
      </Box>
      <TextField
        label="Message"
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
              });
              setMessageText("");

            }
          }
        }}
      />
    </Paper>
  );
}
