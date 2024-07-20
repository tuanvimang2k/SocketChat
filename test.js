const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

let onlineUsers = new Map(); // Sử dụng Map thay vì Object

// Hàm xử lý khi người dùng kết nối
function handleUserConnected(socket) {
    console.log("a user connected", socket.id);
    socket.on("room:join", (roomId) => joinRoom(socket, roomId));
    socket.on("chat:sendMessage", (data) => sendMessage(socket, data));
    socket.on("room:leave", (roomId) => leaveRoom(socket, roomId));
}

// Hàm xử lý khi người dùng tham gia phòng
function joinRoom(socket, roomId) {
    socket.join(roomId);
    let rooms = onlineUsers.get(socket.id) || [];
    rooms.push(roomId);
    onlineUsers.set(socket.id, rooms);

    io.to(roomId).emit("room:onlineUsers", getOnlineUsersInRoom(roomId));
    socket.emit("room:joined", roomId);

    console.log(`Type of roomId: ${typeof roomId}`, roomId);
}

// Hàm xử lý khi người dùng gửi tin nhắn
function sendMessage(socket, data) {
    io.to(data.data.roomId).emit("chat:receiveMessage", data);
    console.log(`Message sent in room ${data.data.roomId}: ${data.data.message}`);
}
// Hàm xử lý khi người dùng nhận tin nhắn;
function receiveMessage(socket, data) {
    io.to(data.roomId).emit("chat:receiveMessage", data);
    console.log(`Message received in room ${data.roomId}: ${data.content}`);
}
// Hàm xử lý khi người dùng rời phòng
function leaveRoom(socket, roomId) {
    socket.leave(roomId);
    let rooms = onlineUsers.get(socket.id) || [];
    rooms = rooms.filter((id) => id !== roomId);
    onlineUsers.set(socket.id, rooms);

    io.to(roomId).emit("room:onlineUsers", getOnlineUsersInRoom(roomId));
    console.log(`User ${socket.id} left room ${roomId}`);
}

// Hàm lấy danh sách người dùng online trong phòng
function getOnlineUsersInRoom(roomId) {
    return Array.from(onlineUsers.entries())
        .filter(([_, rooms]) => rooms.includes(roomId))
        .map(([id, _]) => id);
}

io.on("connection", handleUserConnected);

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});