const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());

let onlineUsers = {}; // Đối tượng để theo dõi người dùng trực tuyến

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    onlineUsers[socket.id] = onlineUsers[socket.id] || [];
    onlineUsers[socket.id].push(roomId); // Lưu trữ phòng mà người dùng tham gia

    // Phát sự kiện online_users đến tất cả người dùng trong phòng
    io.to(roomId).emit(
      "online_users",
      Object.keys(onlineUsers).filter((id) => onlineUsers[id].includes(roomId))
    );

    // Phát sự kiện room_joined chỉ đến socket hiện tại
    socket.emit("room_joined", roomId);

    console.log(`User ${socket.id} joined room ${roomId.toString()}`);
  });

  socket.on("send_message", (data) => {
    io.to(data.roomId).emit("receive_message", data);
    console.log(`roomId ${data.roomId} message: ${data.content} from ${data.sender}`);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
    if (onlineUsers[socket.id]) {
      onlineUsers[socket.id] = onlineUsers[socket.id].filter(
        (id) => id !== roomId
      );
    }

    // Phát sự kiện online_users đến tất cả người dùng trong phòng
    io.to(roomId).emit(
      "online_users",
      Object.keys(onlineUsers).filter((id) => onlineUsers[id].includes(roomId))
    );

    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on("disconnect", () => {
    const rooms = onlineUsers[socket.id];
    if (rooms) {
      rooms.forEach((roomId) => {
        io.to(roomId).emit(
          "online_users",
          Object.keys(onlineUsers).filter((id) =>
            onlineUsers[id].includes(roomId)
          )
        );
      });
      delete onlineUsers[socket.id];
    }
    console.log("user disconnected");
  });

  socket.on("get_connected_rooms", () => {
    const rooms = onlineUsers[socket.id] || [];
    socket.emit("connected_rooms", rooms);
  });

  socket.on("user_active", (roomId) => {
    io.to(roomId).emit("user_active", socket.id);
    console.log(`User ${socket.id} is active in room ${roomId}`);
  });

  socket.on("user_inactive", (roomId) => {
    io.to(roomId).emit("user_inactive", socket.id);
    console.log(`User ${socket.id} is inactive in room ${roomId}`);
  });
});
app.post("/api/send-chat", (req, res) => {
  const { roomId, sender, content } = req.body;
  io.to(roomId).emit("receive_message", { roomId, sender, content });
  res.status(200).send("Message sent");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
