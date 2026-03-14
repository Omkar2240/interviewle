import { addUser, removeUser, matchUsers } from "./matchmaking";

export default function(io) {

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // user clicks "find interview partner"
    socket.on("join-queue", () => {
      addUser(socket);
      matchUsers(io);
    });

    // signaling messages
    socket.on("signal", ({ roomId, data }) => {
      socket.to(roomId).emit("signal", data);
    });

    // skip partner
    socket.on("skip", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("partner-left");

    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      removeUser(socket.id);
    });
  });
};