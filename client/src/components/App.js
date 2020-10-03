import React, { Component } from "react";
import { Router } from "@reach/router";
import NotFound from "./pages/NotFound.js";
import Skeleton from "./pages/Skeleton.js";

import "../utilities.css";

import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Cookies from 'universal-cookie';
const cookies = new Cookies()

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
    let token = cookies.get("cookieToken")
    post("/api/login", { cookieToken: token }).then((user) => {
      this.setState({ userId: user._id, name: user.name });
      if(!token) cookies.set("cookieToken", user.cookieToken)
      post("/api/initsocket", { socketid: socket.id });
    });
  }

  

  handleLogout = () => {
    this.setState({ userId: undefined });
    post("/api/logout");
  };

  render() {
    return (
      <>
        <Router>
          <Skeleton
            path="/"
            name={this.state.name}
            userId={this.state.userId}
          />
          <NotFound default />
        </Router>
      </>
    );
  }
}

export default App;
