import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoute.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Routes
app.use("/api/status", (req, res) => {
    res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Socket.IO
export const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

export const userSocketMap = {};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected:", userId);

    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

// DB + Server start
await connectDB();

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
