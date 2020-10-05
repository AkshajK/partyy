import React, { Component } from "react";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
export const theme = 
      createMuiTheme({
        palette: {
          type: 'dark',
          primary: blue,
          secondary: blue,
          background: {
            //default: '#2F3645',
            //paper: '#232934',
            default: '#262626'
         
          },
          sidebar: "#161616",
          //tablerow: {
           //   odd: '#102755',
          //    even: '#0A1C3D'
          //},
         
          
          
        },
      });