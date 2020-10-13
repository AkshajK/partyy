import React, { Component } from "react";
import {  notification, Space } from 'antd';
import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import ListItemText from "@material-ui/core/ListItemText";
import { post, get,  } from "../../utilities.js";

class CategoryDashboard extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      title: "",
      messageText: ""
    };
  }

  componentDidMount() {
    post("api/getCategoryAndSongData", {}).then((data) => {
      this.setState({data: data});
    })
  }

  render() {
    if(!this.state.data) return <h1>Loading</h1>

    return (
      <div style={{height: "100%", width: "100%", overflow: "auto", padding: "20px 20px 20px 20px"}}>
        
        <Typography component={'div'} variant="h3" color="textPrimary">
                {"Dashboard"}
              </Typography>
    <TextField
        label="Playlist Title"
        variant="outlined"
     
        value={this.state.title}
        fullWidth
        onChange={(event) => {
          this.setState({title: (event.target.value)});
        }}
        
        
      />
<TextField
        label="Playlist Id or Spotify URI"
        variant="outlined"
   
        value={this.state.messageText}
        fullWidth
        onChange={(event) => {
          this.setState({messageText: (event.target.value)});
        }}
        onKeyPress={(event) => {
          if (event.charCode === 13) {
             let idarr = this.state.messageText.split(":")
            let id = idarr[idarr.length - 1]

              post("api/addCategoryAuthenticate", {
                playlistId: id, name: this.state.title
              }).then((data1)=>{
                window.location.href = data1.url;
                /*
                fetch(data1.url, {
                  
                  headers: { "Access-Control-Allow-Origin": "*" },
                }).then((data) => {
                  console.log(data.error ? "FAIL" : "DONE!!")
                  if(!data.error) {
                    
                  }
                });
                */
              })
              this.setState({messageText: ""});

            
          }
        }}
      />
      <Grid container direction="row" style={{width: "calc(100% - 40px)", height: "100%"}}>
        <Box width={1/2} style={{height: "100%", overflow: "auto"}}>
        {
        this.state.data.map((entry) => {
          return (
            <>
          <Typography component={'div'} variant="h4" color="primary">
          {entry.category.name + " (" + entry.songs.length + ")"}
              </Typography>
          
          </>
          )
          
        })
      }
        </Box>
        <Box width={1/2}  style={{height: "100%", overflow: "auto"}} >
        <Button onDoubleClick={()=>{
          
          post("api/addCategoryAuthenticate", {
            playlistId: this.props.category.playlistId, name: this.props.category.name
          }).then((data1)=>{
            window.location.href = data1.url;
          })


        }} fullWidth>{"Double Click to Repull from Spotify"}</Button>

          <Button onDoubleClick={() => {post("api/deleteCategory", {categoryId: this.props.category._id}).then(()=>{window.location.reload()})}} fullWidth>{"Double Click to Delete"}</Button>
        {
        this.state.data.filter((e)=>{
          if(this.props.category && (e.category._id+""=== this.props.category._id))
            return  true;
          return false;
        }).map((entry) => {
          return (
            <>
          <Typography component={'div'}variant="h4" color="primary">
          {entry.category.name}
              </Typography>
          {entry.songs.map((song) => {
            return <Typography component={'div'} variant="h5" color={song.bad ? "primary" : "textPrimary"}>
            {song.title + " by " + song.artist}
                </Typography>
          })}
          </>
          )
          
        })
      }
        </Box>
      </Grid>
      



        
      </div>
    );
  }
}

export default CategoryDashboard;
