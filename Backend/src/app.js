import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import {createServer} from 'node:http';
import mongoose from 'mongoose';
import cors from 'cors';
import {Server} from 'socket.io';
import {connectToSocket} from './controllers/socketManger.js';
import userRoutes from './routes/users.route.js';

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 3000));
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.use('/api/v1/users', userRoutes);

const start = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ MongoDB connected");

        const PORT = app.get("port") || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1); // Exit the process if DB connection fails
    }
};
start();