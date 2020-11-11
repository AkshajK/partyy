import React, { Component } from "react";

import "../../utilities.css";
import { socket } from "../../client-socket.js";

import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import PersonIcon from "@material-ui/icons/Person";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Typography from "@material-ui/core/Typography";
import RoomTable from "../modules/RoomTable.js";
import Chat from "../modules/Chat.js";
import { get, post } from "../../utilities.js";
class Lobby extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {
      buttonColor: "#2e7d32",
      rooms: [],
      messages: [],
    };
  }

  componentDidMount() {
    // remember -- api calls go here!
    if (!this.props.mobile) this.props.setShowSidebar(true);
    post("api/joinLobby", {}).then((data) => {
      if (data.disconnect) {
        this.props.error();
        return;
      }

      this.props.resetMessages();
      this.setState({
        doneLoading: true,
        rooms: data.rooms.concat([]),
        messages: data.messages.concat([]),
      });
    });

    socket.on("room", (room) => {
      let rooms = this.state.rooms.filter((rm) => {
        return rm._id + "" !== room._id + "";
      });
      rooms.push(room);
      this.setState({ rooms: rooms });
    });

    this.props.setLobby(true);
  }
  componentWillUnmount() {
    socket.off("room");
    socket.off("joinedLobby");
    socket.off("leftLobby");
    socket.off("changeName");
  }

  render() {
    let rightbar = this.props.width > 1000;
    return (
      <Grid container direction="row" style={{ width: "100%", height: "100%", overflow: "auto" }}>
        <Box
          width={rightbar ? "calc(100% - 320px)" : "100%"}
          height="100%"
          style={{ padding: "30px 40px 40px 40px" }}
        >
          <Box
            height="50px"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: "10px",
            }}
          >
            {this.props.category ? (
              <React.Fragment>
                <Grid container direction="row" spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      style={{ backgroundColor: this.state.buttonColor, color: "#FFFFFF" }}
                      onMouseOver={() => {
                        this.setState({ buttonColor: "#43a047" });
                      }}
                      onMouseOut={() => {
                        this.setState({ buttonColor: "#2e7d32" });
                      }}
                      variant="contained"
                      onClick={() => {
                        this.setState({disable: true}, ()=>{
                        post("api/createRoom", { categoryId: this.props.category._id }).then(
                          (data) => {
                            this.props.redirect("/" + data.name);
                            this.setState({disable: false}) 
                          }
                        )
                        })
                      }}
                      disabled={this.state.disable}
                    >
                      <Typography noWrap variant="button">
                        {" "}
                        New {this.props.category.name} Game{" "}
                      </Typography>
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      color="secondary"
                      variant="outlined"
                      onClick={() => {
                        this.setState({disable: true}, ()=>{
                        post("api/createRoom", {
                          categoryId: this.props.category._id,
                          private: true,
                        }).then((data) => {
                          
                          this.props.redirect("/" + data.name);
                          this.setState({disable: false}) 
                        });
                      })
                      }}
                      disabled={this.state.disable}
                    >
                      <Typography noWrap variant="button">
                        {" "}
                        Private Game{" "}
                      </Typography>
                    </Button>
                  </Grid>
                </Grid>
              </React.Fragment>
            ) : (
              <></>
            )}
          </Box>
          <Box
            height={this.props.login ? "calc(100% - 70px)" : "calc(100% - 50px)"}
            style={{ marginBottom: this.props.login ? "10px" : undefined }}
          >
            <RoomTable
              rooms={this.state.rooms}
              redirect={this.props.redirect}
              categoryId={this.props.category ? this.props.category._id : undefined}
            />
          </Box>
          {this.props.login || <></>}
        </Box>
        {rightbar ? (
          <Box width="320px" height="100%" style={{ overflow: "auto" }} bgcolor="sidebar">
            {this.props.userInfo}
            <Box width="100%" height="calc(100% - 205px)">
              <Chat lobby={true} messages={this.state.messages.concat(this.props.messages)} />
            </Box>
          </Box>
        ) : (
          <React.Fragment />
        )}
      </Grid>
    );
  }
}

export default Lobby;
