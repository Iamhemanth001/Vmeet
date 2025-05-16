import { Server } from "socket.io";

export const connectToSocket = (server) =>{
    const io = new Server(server);// node http.Server
    return io;
}

