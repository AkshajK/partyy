import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "./pages/NotFound.js";

import SideBar from "./modules/SideBar.js"

import RoomSideBar from "./modules/RoomSideBar.js"
import Lobby from "./pages/Lobby.js"
import CategoryDashboard from "./pages/CategoryDashboard.js"
import Room from "./pages/Room.js"
import CircularProgress from "@material-ui/core/CircularProgress";
import "../utilities.css";
import {Modal} from "antd";
import 'antd/dist/antd.css'
import {theme} from "./theme.js"
import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Cookies from "universal-cookie";
const cookies = new Cookies();

import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";

import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

/**
 * Define the "App" component as a class.
 */


class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
    this.state = {
      userId: undefined,
      messages: [],
      showSidebar: true,
      rainbow: true,
      redirect: "",
      lobby: true,
      users: []
    };
  }
  setLobby = (bool) => {
    this.setState({lobby: bool})
  }
  setUsers = (arr) => {
    this.setState({users: arr})
  }
  setCategory  = (c) => {
    this.setState({category: c})
  }
  setShowSidebar = (bool) => {
    this.setState({showSidebar: bool})
  }
  toggleRainbow = () => {
    this.setState({rainbow: !this.state.rainbow});
  }
  componentDidMount() {
    // login
    let token = cookies.get("cookieToken");
    post("/api/login", { cookieToken: token }).then((user) => {
      
      post("/api/initsocket", { socketid: socket.id }).then(()=>{
        this.setState({ userId: user._id, userName: user.name, userLeaderboardData: user.leaderboardData });
        if (!token) cookies.set("cookieToken", user.cookieToken, {expires: new Date('December 17, 2030 03:24:00')});
      });
    });
    socket.on("reconnect_failed", () => {
      this.setState({ disconnect: true });
      
      //window.location.reload();
    });
    
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        this.setState({ disconnect: true });
      }
      else {
        console.log("DISCONNECTED")
        console.log(reason)
        this.setState({ disconnect: true });
      }
     
    });

    socket.on("message", (msg) => {
      let messages = this.state.messages.concat([]);
      messages.push(msg)
      this.setState({messages: messages})
    })
    /*
    socket.on("connect", () => {
      setInterval(() => {
          if(!socket.connected) {
            DOSOMETHAINHERE;
          }
      }, 10000)
  })*/
    socket.on("reconnect", (attemptNumber) => {
       // this.componentDidMount();
      console.log("RECONNECTED");
    })
    
  }

  componentWillUnmount() {
    // socket.off("createdRoom")
    // socket.off("joinRoomLobby")
    // socket.off("leftRoomLobby")
    socket.off("message");
   }
  
  handleLogout = () => {
    this.setState({ userId: undefined });
    post("/api/logout");
  };

  
  redirect = (link) => {
    this.setState({ redirect: link });
  };

  changeName=(name) => {
    this.setState({userName: name});
  }

  render() {
    if (!this.state.userId) {
      return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline /><CircularProgress />
        </MuiThemeProvider>);
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
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
      <Grid container direction="row" style={{ width: "100%", height: "100%" }}>
        
        {this.state.showSidebar ? <Box width="320px" height="100%" bgcolor="sidebar">
          <SideBar changeName={this.changeName} users={this.state.users} lobby={this.state.lobby} userName={this.state.userName} userId={this.state.userId} //userLeaderboardData={this.state.userLeaderboardData}
          category={this.state.category} setCategory={this.setCategory} />
        </Box> : <React.Fragment />}
        <Box width={this.state.showSidebar ? "calc(100% - 320px)" : "100%"} height="100%" >
          
          <Router>
            <Switch>
              
              <Lobby exact path="/" setLobby={this.setLobby} setShowSidebar={this.setShowSidebar} url={window.location.pathname} name={this.state.name} userId={this.state.userId} category={this.state.category} redirect={this.redirect} messages={this.state.messages.filter((msg)=>{return msg.roomId === "Lobby"})} resetMessages={()=>{this.setState({messages: []})}} />
              <CategoryDashboard exact path="/dashboard" category={this.state.category} />
              <Room exact path="/:roomName" setUsers={this.setUsers} setLobby={this.setLobby} rainbow={this.state.rainbow} changeName={this.changeName} toggleRainbow = {this.toggleRainbow} setCategory={this.setCategory} showSidebar={this.state.showSidebar} setShowSidebar={this.setShowSidebar} url={window.location.pathname} name={this.state.userName} userId={this.state.userId} redirect={this.redirect} messages={this.state.messages} />
              
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
      </MuiThemeProvider>
    );
  }
}

export default App;
