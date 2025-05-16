import express from 'express';
import {createServer} from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import {Server} from 'socket.io';
import {connectToSocket} from './controllers/socketManger.js';

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 3000));
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.get('/home', (req, res) => {
    return res.send('Hello World'); 
});

const start = async () => {
    const connectionDb = 'process.env.MONGODB_URI';
    console.log("MongoDB connected");
    app.listen(app.get("port"), () => {
        console.log('Server is running on port 3000');
    });
}

start();