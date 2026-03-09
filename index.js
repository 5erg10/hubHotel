'use strict'

const path = require('path');

const dotenv = require('dotenv').config({
  path: path.resolve(__dirname, './env',`.env.${process.env.NODE_ENV || 'local'}`)
});

const express = require('express');
const http = require('http');
const apiRoutes = require("./routes/routes.js");

const sessionController = require('./controllers/sessionController.js');
const Sockets = require('./controllers/sockestCtrl.js');

const app = express();

const server = http.createServer(app);

const secIO = require('socket.io')(server);

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

const ssss = new Sockets(secIO, sessionController);

ssss.init();

server.listen(port,() => {
	console.log('socket server running on '+port+' port');
});

app.use('/', apiRoutes);
