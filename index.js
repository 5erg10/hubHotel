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

// ── MongoDB ────────────────────────────────────────────────────────────────────
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hubhotel';

// mongoose
//   .connect(MONGO_URI)
//   .then(() => console.log(`MongoDB connected: ${MONGO_URI}`))
//   .catch((err) => {
//     console.error('MongoDB connection error:', err.message);
//     process.exit(1);
//   });

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// app.use(express.static("web"));

// app.get('/', (request, response) => {
//   response.redirect('/index.html');
// });

const server = http.createServer(app);

const secIO = require('socket.io')(server);

server.listen(port,() => {
	console.log('socket server running on '+port+' port');
});

app.use('/', apiRoutes);

secIO.on('connection', (socketIO) => {

    socketIO.on("disconnect", () => {
        try {
            const user = socketIO.data.user;
            console.log("Usuario desconectado: ", user);
            if (user) {
                secIO.emit("logOutUser", user);
                sessionController.removeUser(user);
            }
        } catch(err) {
            console.log('error on remove user: ', err);
        }
    });

    socketIO.on('loginUser', (data) => {
        console.log('user login: ', data);
        socketIO.data.user = data;
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
});

sessionController.expireSessions(secIO);