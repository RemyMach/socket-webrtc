import express from 'express';
import { getIO, initIO } from './server';

import fs from 'fs';

const app = express();

var privateKey = fs.readFileSync( '/etc/letsencrypt/live/stun.machavoine.fr/privkey.pem');
var certificate = fs.readFileSync( '/etc/letsencrypt/live/stun.machavoine.fr/cert.pem');


app.use(express.json());

app.use(function (req, res, next) {
    console.log("on passe dans le middleware");

    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', ['Content-Type','Authorization', '*']);

    next();
});

const httpServer = require('https').createServer(
	{
		key: privateKey,
   		 cert: certificate
	}, app);

//const httpServer = require('http').createServer(app);

let port = process.env.PORT || 5000;

initIO(httpServer);

httpServer.listen(port)
console.log("Server started on ", port);

getIO();