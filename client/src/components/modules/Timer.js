import Box from "@material-ui/core/Box";
import React, { Component, useState, useEffect } from "react";
import { get, post } from "../../utilities";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import {Progress } from 'antd';
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";

import { makeStyles, withStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
/*
const BorderLinearProgress = withStyles((theme) => ({
  root: {
    height: 10,
    borderRadius: 5,
  },
  colorPrimary: {
    backgroundColor: theme.palette.grey[theme.palette.type === "dark" ? 700 : 200],
  },
  bar: {
    borderRadius: 5,
    //backgroundColor: props.color,//#1a90ff
   // backgroundImage: "linear-gradient(to left, red,orange,yellow,green,blue,indigo,violet)"
  },
}))(LinearProgress);
*/
export default function Timer(props) {

 
  

  let initialValue =  (new Date(props.endTime).getTime() - new Date().getTime()) / 1000.0;
  if(initialValue < 0) initialValue = 0
  const [rerender, forceRerender] = React.useState(0);
  const [value, setValue] = React.useState(initialValue)
  const [max, setMax] = React.useState(props.max)
  useEffect(() => {
    let val = setInterval(() => {
        let setVal = Math.max((new Date(props.endTime).getTime() - new Date().getTime()) / 1000.0, 0)
        //console.log(setVal + " " + props.endTime + " " + props.max);
        setValue(setVal);
        setMax(props.max)
    }, 100)
    return () => {clearInterval(val)}
  
    }, [props.endTime, props.max])
  

    /*
  console.log("reseettin timer!")
  let originalValue = (new Date(props.endTime).getTime() - new Date().getTime()) / 1000.0;
  const [value, setValue] = useState(originalValue);
  const [isetInterval, setSetInterval] = useState(false);
  const [color, setColor] = useState("#6c57f5");
  let counter = 0;
  if(!isetInterval) {
  let interval = setInterval(() => {
    let val = (new Date(props.endTime).getTime() - new Date().getTime()) / 1000.0;
    setValue(val);
    counter = counter + 0.1;
    if (val < 0) clearInterval(interval);
    //console.log(val);
  }, 100);
  setSetInterval(true)
  }
  */

  /*
  if (value <= 3 && value >= -5 && color !== "#FF0000") {
    setColor("#FF0000");
  }*/

  let input = Math.min((value / max) * 100.0,100)
  let color= props.rainbow ? 'hsl('+(Math.floor((new Date().getTime())/50) % 360)+', 100%, 50%)' : "#1a90ff"
  return (
    /* <h1 style={{color: color, display: "flex", justifyContent: "center"}}>{value+1}</h1>*/
    <Progress percent={max < 3.1 ? (input) : (100.0-input)}   
      showInfo={false}
    trailColor="#616161" 
    strokeColor={color}
    strokeWidth="10px"
    style={{marginTop: "-7px", marginBottom: "5px"}}
    />
  );
}
