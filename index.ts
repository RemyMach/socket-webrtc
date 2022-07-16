import express from 'express';
import { getIO, initIO } from './server';

const app = express();

const httpServer = require('http').createServer(app);

let port = process.env.PORT || 3500;

initIO(httpServer);

httpServer.listen(port)
console.log("Server started on ", port);

getIO();