import React, { Component } from "react";

import "../../utilities.css";

import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

class CategoryDashboard extends Component {
  constructor(props) {
    super(props);
    // Initialize Default State
    this.state = {};
  }

  componentDidMount() {
    // remember -- api calls go here!
  }

  render() {
    return (
      <>
        
    <h1>Welcome to Partyy, {this.props.name || "Guest"}</h1>
        
      </>
    );
  }
}

export default CategoryDashboard;