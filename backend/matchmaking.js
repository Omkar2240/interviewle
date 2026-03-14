import { v4 as uuidv4 } from "uuid";

let waitingUsers = [];

function addUser(socket) {
  waitingUsers.push(socket);
}

function removeUser(socketId) {
  waitingUsers = waitingUsers.filter(user => user.id !== socketId);
}

function matchUsers(io) {
  if (waitingUsers.length >= 2) {

    const user1 = waitingUsers.shift();
    const user2 = waitingUsers.shift();

    const roomId = uuidv4();

    user1.join(roomId);
    user2.join(roomId);

    io.to(user1.id).emit("matched", {
      roomId,
      initiator: true
    });

    io.to(user2.id).emit("matched", {
      roomId,
      initiator: false
    });

    console.log("Matched:", user1.id, user2.id);
  }
}

export default {
  addUser,
  removeUser,
  matchUsers
};