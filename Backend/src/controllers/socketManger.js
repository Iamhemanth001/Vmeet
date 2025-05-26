import { Server } from "socket.io";

let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("SOMETHING CONNECTED");

        socket.on("join-call", (roomId) => {
            socket.join(roomId);
            timeOnline[socket.id] = new Date();

            const room = io.sockets.adapter.rooms.get(roomId);
            const participants = [...room || []];

            // Inform everyone in the room about the new user
            io.to(roomId).emit("user-joined", socket.id, participants);

            // Send chat history to the new user
            if (messages[roomId]) {
                messages[roomId].forEach(msg => {
                    socket.emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
                });
            }
        });

        socket.on("chat-message", (data, sender) => {
            const rooms = [...socket.rooms].filter(r => r !== socket.id);
            if (rooms.length > 0) {
                const roomId = rooms[0];  // assuming one room per socket
                if (!messages[roomId]) messages[roomId] = [];

                messages[roomId].push({ data, sender, "socket-id-sender": socket.id });
                io.to(roomId).emit("chat-message", data, sender, socket.id);
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("disconnect", () => {
            const disconnectTime = new Date();
            const duration = Math.abs(disconnectTime - (timeOnline[socket.id] || disconnectTime));

            // Clean up from all rooms
            socket.rooms.forEach(roomId => {
                socket.to(roomId).emit("user-left", socket.id);
            });

            delete timeOnline[socket.id];
        });
    });

    return io;
};
