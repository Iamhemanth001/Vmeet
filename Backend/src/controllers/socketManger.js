import { Server } from "socket.io";

// Store messages by roomId
let messages = {};
let timeOnline = {};
let usernames = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Change this to your frontend origin in production
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`✅ New connection: ${socket.id}`);

        // JOIN CALL / ROOM
        socket.on("join-call", ({ room, username }) => {
            const roomId = room;
            socket.join(roomId);
            timeOnline[socket.id] = new Date();
            usernames[socket.id] = username; // Store username

            const roomObj = io.sockets.adapter.rooms.get(roomId);
            const participants = roomObj ? [...roomObj] : [];
            
            const participantsWithNames = participants.map(id => ({
                socketId: id,
                username: usernames[id] || "Unknown"
            }));

            io.to(roomId).emit("user-joined", socket.id, participantsWithNames);

            // Send chat history to the new user
            if (messages[roomId]) {
                messages[roomId].forEach(msg => {
                    socket.emit("chat-message", msg.data, msg.sender, msg["socket-id-sender"]);
                });
            } else {
                messages[roomId] = [];
            }
        });


        // CHAT MESSAGE HANDLING
        socket.on("chat-message", (data, sender) => {
            const rooms = [...socket.rooms].filter(r => r !== socket.id);
            const roomId = rooms[0]; // Assuming 1 room per socket

            if (!roomId) return;

            const msg = {
                data,
                sender,
                "socket-id-sender": socket.id,
                room: roomId,
            };

            messages[roomId].push(msg); // Save to room history
            io.to(roomId).emit("chat-message", msg); // Broadcast to room
        });

        // WEBRTC SIGNAL HANDLING
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // HANDLE USER DISCONNECT
        socket.on("disconnect", () => {
            const disconnectTime = new Date();
            const connectTime = timeOnline[socket.id] || disconnectTime;
            const duration = Math.abs(disconnectTime - connectTime);

            console.log(`❌ Disconnected: ${socket.id}, connected for ${duration / 1000}s`);

            // Inform other users in rooms
            socket.rooms.forEach(roomId => {
                socket.to(roomId).emit("user-left", socket.id);
            });

            delete timeOnline[socket.id];
        });
    });

    return io;
};
