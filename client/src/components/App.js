import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "./pages/NotFound.js";
import SideBar from "./modules/SideBar.js"
import Lobby from "./pages/Lobby.js"
import Room from "./pages/Room.js"
import CategoryDashboard from "./pages/CategoryDashboard.js"
import CircularProgress from "@material-ui/core/CircularProgress";
import "../utilities.css";
import {Modal} from "antd";
import 'antd/dist/antd.css'

import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Cookies from "universal-cookie";
const cookies = new Cookies();

import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";


/**
 * Define the "App" component as a class.
 */
class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
    this.state = {
      userId: undefined,
      messages: []
    };
  }
  setCategory  = (c) => {
    this.setState({category: c})
  }
  componentDidMount() {
    // login
    let token = cookies.get("cookieToken");
    post("/api/login", { cookieToken: token }).then((user) => {
      
      post("/api/initsocket", { socketid: socket.id }).then(()=>{
        this.setState({ userId: user._id, userName: user.name, userLeaderboardData: user.leaderboardData });
        if (!token) cookies.set("cookieToken", user.cookieToken);
      });
    });
    socket.on("reconnect_failed", () => {
      this.setState({ disconnect: true });
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        this.setState({ disconnect: true });
      }
    });

    socket.on("message", (msg) => {
      let messages = this.state.messages.concat([]);
      messages.push(msg)
      this.setState({messages: messages})
      console.log("GOT THE MESSAGE")
      console.log(msg)
    })
  }

  handleLogout = () => {
    this.setState({ userId: undefined });
    post("/api/logout");
  };

  redirect = (link) => {
    this.setState({ redirect: link });
  };

  render() {
    if (!this.state.userId) {
      return <CircularProgress />;
    }
    
 
    if (this.state.redirect !== "") {
      let page = this.state.redirect;
      this.setState({ redirect: "" });
      return (
        <Router>
          <Redirect to={page} />
        </Router>
      );
    }
    
    return (
      <Grid container direction="row" style={{ width: "100%", height: "100%" }}>
        
        <Box width="300px" height="100%">
          <SideBar userName={this.state.userName} userLeaderboardData={this.state.userLeaderboardData}
          category={this.state.category} setCategory={this.setCategory} />
        </Box>
        <Box width="calc(100% - 300px)" height="100%">
          <Router>
            <Switch>
              <Lobby exact path="/" name={this.state.name} userId={this.state.userId} category={this.state.category} redirect={this.redirect} messages={this.state.messages.filter((msg)=>{return msg.roomId === "Lobby"})} />
              <Room exact path="/:roomName" name={this.state.name} userId={this.state.userId} redirect={this.redirect} messages={this.state.messages} />
              <NotFound default />
            </Switch>
          </Router>
        </Box>

        {this.state.disconnect ? (
          Modal.error({
            title: "Disconnected",
            content: (
              <div>
                <p>
                  You have disconnected. Maybe you opened Partyy in another tab, or you have
                  been inactive for a long period of time.
                </p>
                <p>Hit OK to relaunch Partyy!</p>
              </div>
            ),
            onOk() {
              window.location.href = "/";
            },
          })
        ) : (
          <></>
        )}
      </Grid>
    );
  }
}

export default App;
