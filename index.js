'use strict'

const express = require('express');
const apiRoutes = require("./routes/routes.js")
const sessionController = require('./controllers/sessionController.js');
const http = require('http');
const path = require('path');

const dotenv = require('dotenv').config({
  path: path.resolve(__dirname, './env',`.env.${process.env.NODE_ENV || 'local'}`)
});

const app = express();

const port = process.env.PORT || 443;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "'GET,PUT,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static("web"));

app.get('/', (request, response) => {
  response.redirect('/index.html');
});

const server = http.createServer(app);

const secIO = require('socket.io')(server);

server.listen(port,() => {
	console.log('socket server running on '+port+' port');
});

app.use('/', apiRoutes);

secIO.on('connection', (socketIO) => {
    socketIO.on('userLogOut', (data) => {
        secIO.emit("logOutUser", data);
    });
    socketIO.on('loginUser', (data) => {
        sessionController.addNewUser(data);
        secIO.emit("newUserLogin", sessionController.recoverUsers());
    });
    socketIO.on('StatusUser', (data) => {
        secIO.emit("refreshUsers", data);
        sessionController.refreshUserPosition(data);
    });
    socketIO.on('publicChat', (data) =>  {
        secIO.sockets.emit('publicChatResponses', data);
    });
    socketIO.on('privateChat', (data) =>  {
        secIO.sockets.emit(data.receiver, data);
    });
    socketIO.on('sendLogOutUser', (data) => {
        secIO.emit("logOutUser", data);
        sessionController.removeUser(data);
    });
});

sessionController.expireSessions(secIO);