import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
import NotFound from "./pages/NotFound.js";

import SideBar from "./modules/SideBar.js";

import Lobby from "./pages/Lobby.js";
import CategoryDashboard from "./pages/CategoryDashboard.js";
import BotDashboard from "./pages/BotDashboard.js";
import Room from "./pages/Room.js";
import CircularProgress from "@material-ui/core/CircularProgress";
import "../utilities.css";
import { Modal } from "antd";
import "antd/dist/antd.dark.css";
import { theme } from "./theme.js";
import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Cookies from "universal-cookie";
const cookies = new Cookies();
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";

import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import GoogleLogin, { GoogleLogout } from "react-google-login";

const GOOGLE_CLIENT_ID = "234226613823-00e5p1368ao3f1lr038a6odtgn5rud95.apps.googleusercontent.com";
/**
 * Define the "App" component as a class.
 */

class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
    let google = cookies.get("google") === "true";
    this.state = {
      userId: undefined,
      loaded: false,
      userInfo: <></>,
      messages: [],
      showSidebar: true,
      rainbow: true,
      redirect: "",
      google: google,
      lobby: true,
      users: [],
      width: 0,
      height: 0,
    };
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }
  setUserInfo = (info) => {
    this.setState({ userInfo: info });
  };
  setLobby = (bool) => {
    this.setState({ lobby: bool });
  };
  setUsers = (arr) => {
    this.setState({ users: arr });
  };
  setCategory = (c) => {
    this.setState({ category: c });
  };
  setShowSidebar = (bool) => {
    this.setState({ showSidebar: bool });
  };
  toggleRainbow = () => {
    this.setState({ rainbow: !this.state.rainbow });
  };
  componentDidMount() {
    socket.on("connect", () => {
      this.setState({ loaded: false }, () => {
        this.updateWindowDimensions();
        window.addEventListener("resize", this.updateWindowDimensions);
        // login

        let token = cookies.get("cookieToken");
        post("/api/whoami", {}).then((user) => {
          if (user._id) {
            post("/api/initsocket", { socketid: socket.id }).then((res) => {
              if(!res.init) this.error()
              else {
              this.setState({
                loaded: true,
                userId: user._id,
                userName: user.name,
                userLeaderboardData: user.leaderboardData,
              });
              if (!token)
                cookies.set("cookieToken", user.cookieToken, {
                  expires: new Date("December 17, 2030 03:24:00"),
                });
              }
            });
          } else {
            post("/api/login", { cookieToken: token }).then((user) => {
              post("/api/initsocket", { socketid: socket.id }).then((res) => {
                if(!res.init) this.error()
                else {
                this.setState({
                  loaded: true,
                  userId: user._id,
                  userName: user.name,
                  userLeaderboardData: user.leaderboardData,
                });
                if (!token)
                  cookies.set("cookieToken", user.cookieToken, {
                    expires: new Date("December 17, 2030 03:24:00"),
                  });
                }
              });
            });
          }
        });
      });
    });
    socket.on("reconnect_failed", () => {
      this.error();
      //window.location.reload();
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        this.error();
      } else {
        console.log("DISCONNECTED");
        console.log(reason);
      }
    });
    socket.on("reconnect_error", function () {
      /* handle reconnect error events - possible retry? */
      this.error();
    });

    socket.on("message", (msg) => {
      let messages = this.state.messages.concat([]);
      messages.push(msg);
      this.setState({ messages: messages });
    });
    /*
    socket.on("connect", () => {
      setInterval(() => {
          if(!socket.connected) {
            DOSOMETHAINHERE;
          }
      }, 10000)
  })*/
    /*
    let self = this;
    socket.on("reconnect", (attemptNumber) => {
      self.setState({ loaded: false }, () => {
        self.componentDidMount();
        console.log("RECONNECTED");
      });
    });*/
  }

  componentWillUnmount() {
    // socket.off("createdRoom")
    // socket.off("joinRoomLobby")
    // socket.off("leftRoomLobby")

    socket.off("message");
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth, height: window.innerHeight, showSidebar: (this.state.showSidebar && (window.innerWidth >= 500))  || (window.innerWidth >= 1100)});
  }
  handleGoogleLogin = (res) => {
    console.log(`Logged in as ${res.profileObj.name}`);
    const userToken = res.tokenObj.id_token;
    const cookieToken = cookies.get("cookieToken");
    post("/api/googleLogin", { token: userToken, cookieToken: cookieToken }).then((user) => {
      //this.setState({ loaded: true, userId: user._id , name: user.name, google:true});
      cookies.set("google", "true");
      window.location.reload();
      //this.componentDidMount();
    });
  };
  handleLogout = () => {
    let self = this;
    async function cookieStuff() {
      cookies.set("google", "false");
    }
    async function finishLogout() {
      await cookieStuff();
      
      self.setState({
        google: false,
      }, () => {
        console.log("hi");
        window.location.reload();
        
      
      });
      
      //self.componentDidMount();
      return false;
    }

    finishLogout();
  };

  redirect = (link) => {
    this.setState({ redirect: link });
  };

  changeName = (name) => {
    this.setState({ userName: name });
  };

  error = () => {
    Modal.error({
      title: "Disconnected",
      content: (
        <div>
          <p>
            You have disconnected. Maybe you opened Partyy in another tab, or you have been inactive
            for a long period of time.
          </p>
          <p>Hit OK to relaunch Partyy!</p>
        </div>
      ),
      onOk() {
        window.location.reload();
      },
    });
  };

  render() {
    if (!this.state.loaded) {
      return (
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <Box width="100%" style={{display: "flex", justifyContent: "center", marginTop: "50px"}}>
          <CircularProgress />
          </Box>
        </MuiThemeProvider>
      );
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
    let mobile = this.state.width < 500

    let showSidebar = this.state.showSidebar;
    let login = <div className="login">
    {this.state.google ? (
      <GoogleLogout
        clientId={GOOGLE_CLIENT_ID}
        buttonText="Logout"
        onLogoutSuccess={this.handleLogout}
        onFailure={(err) => console.log(err)}
        render={(renderProps) => (
          <Button
            onClick={() => {
              renderProps.onClick();
            }}
            disabled={renderProps.disabled || !this.state.loaded}
            fullWidth
            
            color={mobile ? "primary" : "inherit"}
            variant={mobile ? "outlined" : undefined}
          >
            {mobile ? "Logout " + this.state.userName : "Log Out"}
          </Button>
        )}
      />
    ) : (
      <GoogleLogin
        clientId={GOOGLE_CLIENT_ID}
        buttonText="Login"
        onSuccess={this.handleGoogleLogin}
        onFailure={(err) => console.log(err)}
        render={(renderProps) => (
          <Button
            onClick={() => {
              renderProps.onClick();
            }}
            disabled={renderProps.disabled || !this.state.loaded}
            fullWidth
            color={mobile ? "primary" : "inherit"}
            variant={mobile ? "outlined" : undefined}

          >
            Login
          </Button>
        )}
      />
    )}
  </div>
    return (
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <Grid container direction="row" style={{ width: "100%", height: "100%" }}>
         
            <Box
              width={showSidebar ? "320px" : "0px"}
              height="100%"
              bgcolor="sidebar"
              style={{ borderRight: undefined }}
            >
              <Box width="100%" height="calc(100% - 70px)">
                <SideBar
                  changeName={this.changeName}
                  setUserInfo={this.setUserInfo}
                  users={this.state.users}
                  lobby={this.state.lobby}
                  userName={this.state.userName}
                  userId={this.state.userId} //userLeaderboardData={this.state.userLeaderboardData}
                  category={this.state.category}
                  setCategory={this.setCategory}
                />
              </Box>
              {showSidebar ? login : <></>}
            </Box>
          
          <Box width={showSidebar ? "calc(100% - 320px)" : "100%"} height="100%">
            <Router>
              <Switch>
                <Lobby
                  exact
                  path="/"
                  userInfo={this.state.userInfo}
                  setLobby={this.setLobby}
                  setShowSidebar={this.setShowSidebar}
                  url={window.location.pathname}
                  name={this.state.userName}
                  userId={this.state.userId}
                  category={this.state.category}
                  redirect={this.redirect}
                  error={this.error}
                  messages={this.state.messages.filter((msg) => {
                    return msg.roomId === "Lobby";
                  })}
                  resetMessages={() => {
                    this.setState({ messages: [] });
                  }}
                  width={this.state.width}
                  mobile = {mobile}
                  login = {mobile ? login : undefined}
                />
                <CategoryDashboard exact path="/dashboard" category={this.state.category} />
                <BotDashboard exact path="/bots" category={this.state.category} />

                <Room
                  exact
                  path="/:roomName"
                  width={this.state.width}
                  mobile = {mobile}
                  setUsers={this.setUsers}
                  setLobby={this.setLobby}
                  rainbow={this.state.rainbow}
                  changeName={this.changeName}
                  error={this.error}
                  toggleRainbow={this.toggleRainbow}
                  setCategory={this.setCategory}
                  showSidebar={showSidebar}
                  setShowSidebar={this.setShowSidebar}
                  url={window.location.pathname}
                  name={this.state.userName}
                  userId={this.state.userId}
                  redirect={this.redirect}
                  messages={this.state.messages}
                />

                <NotFound default />
              </Switch>
            </Router>
          </Box>
        </Grid>
      </MuiThemeProvider>
    );
  }
}

export default App;
