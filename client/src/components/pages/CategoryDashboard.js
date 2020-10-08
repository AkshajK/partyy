import React, { Component } from "react";
import { Button, notification, Space } from 'antd';
import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import ListItemText from "@material-ui/core/ListItemText";
import { post, get } from "../../utilities.js";

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
      <div style={{height: "100%", overflow: "auto", margin: "20px 20px 20px 20px"}}>
        
        <Typography variant="h3" color="textPrimary">
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
        label="Playlist Id"
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

              post("api/addCategory", {
                playlistId: id, name: this.state.title
              }).then((data) => {
                console.log(data.error ? "FAIL" : "DONE!!")
                if(!data.error) {
                  notification.success({
                    message: 'Success!',
                    description:
                      this.state.title + " has been added!"
                   ,
                  });
                }
              });
              this.setState({messageText: ""});

            
          }
        }}
      />
      {
        this.state.data.map((entry) => {
          return (
            <>
          <Typography variant="h4" color="primary">
          {entry.category.name}
              </Typography>
          {entry.songs.map((song) => {
            return <Typography variant="h5" color="textPrimary">
            {song.title + " by " + song.artist}
                </Typography>
          }).filter((val, i) => {
            if(this.props.category && (entry.category._id+""=== this.props.category._id)) {
              return  true;
            }
            return (i<3);
          })}
          </>
          )
          
        })
      }



        
      </div>
    );
  }
}

export default CategoryDashboard;
