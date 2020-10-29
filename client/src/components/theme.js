import React, { Component } from "react";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import blue from '@material-ui/core/colors/blue';
import green from '@material-ui/core/colors/green';
export const theme = 
      createMuiTheme({
        palette: {
          type: 'dark',
          primary: blue,
          secondary: green,
          background: {
            //default: '#2F3645',
            paper: '#262626',
            default: '#161616'
         
          },
          sidebar: "#121212",
          //tablerow: {
           //   odd: '#102755',
          //    even: '#0A1C3D'
          //},
         
          
          
        },
      });