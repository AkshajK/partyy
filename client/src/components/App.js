import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "./pages/NotFound.js";
import SideBar from "./modules/SideBar.js"
import Lobby from "./pages/Lobby.js"
import Room from "./pages/Room.js"
import CategoryDashboard from "./pages/CategoryDashboard.js"
import CircularProgress from "@material-ui/core/CircularProgress";
import "../utilities.css";

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
    };
  }

  componentDidMount() {
    // login
    let token = cookies.get("cookieToken");
    post("/api/login", { cookieToken: token }).then((user) => {
      this.setState({ userId: user._id, userName: user.name });
      if (!token) cookies.set("cookieToken", user.cookieToken);
      post("/api/initsocket", { socketid: socket.id });
    });
  }

  handleLogout = () => {
    this.setState({ userId: undefined });
    post("/api/logout");
  };

  render() {
    if (!this.state.userId) {
      return <CircularProgress />;
    }
    return (
      <Grid container direction="row" style={{ width: "100%" }}>
        <Box width="300px">
          <SideBar userName={this.state.userName} />
        </Box>
        <Box width="calc(100%-300px)">
          <Router>
            <Switch>
              <Lobby exact path="/" name={this.state.name} userId={this.state.userId} />
              <Room exact path="/:roomName" name={this.state.name} userId={this.state.userId} />
              <NotFound default />
            </Switch>
          </Router>
        </Box>
      </Grid>
    );
  }
}

export default App;
