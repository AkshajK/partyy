import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";

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
      <>
        
    <h1>Welcome to Partyy Dashboard</h1>
<TextField
        label="Message"
        variant="outlined"
        size="small"
        value={this.state.messageText}
        fullWidth
        onChange={(event) => {
          this.setState({messageText: (event.target.value)});
        }}
        onKeyPress={(event) => {
          if (event.charCode === 13) {
            

              post("api/addCategory", {
                playlistId: this.state.messageText,
              }).then((error) => {
                console.log(error ? "FAIL" : "DONE!!")
                if(!error) {
                  this.componentDidMount();
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
          <h3>{entry.category.name}</h3>
          {entry.songs.map((song) => {
            return <h4>{song.title + " by " + song.artist}</h4>
          })}
          </>
          )
          
        })
      }



        
      </>
    );
  }
}

export default CategoryDashboard;
