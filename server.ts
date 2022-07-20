import { Server, Socket } from "socket.io";

let IO: any;

const rtcMessages: any[] = [];
const roomToUsers: Map<string, string[]> = new Map();

export const initIO = (httpServer: Server) => {
  IO = require("socket.io")(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  IO.use((socket: any, next: any) => {
    if (socket.handshake.query) {
      console.log("middleware");
      console.log(socket.handshake.query);
      let userName = socket.handshake.query.user;
      let room = socket.handshake.query.room;
      socket.user = userName;
      socket.room = room;
      next();
    }
  });

  IO.on("connection", (socket: any) => {
    console.log(socket.user, "Connected");
    socket.join(socket.user);
    socket.join(socket.room);

    socket.on("joinConversation", (data: { name: string; rtcMessage: any }) => {
      console.log("joinConversation");
      console.log("userToJoin ", data.name);
      console.log("sender  ", socket.user);
      socket.to(data.name).emit("newCallByJoin", {
        caller: socket.user,
        rtcMessage: data.rtcMessage,
      });
    });

    socket.on("getUsersToJoin", (data: { room: string }) => {
      console.log("getUsersToJoin");
      console.log(data);
      let users = roomToUsers.get(data.room);
      console.log(users);
      console.log(roomToUsers);
      console.log(socket.user);
      socket.emit("getAllUsersToJoin", users ?? []);
    });

    socket.on("call", (data: any) => {
      // l'appelant récup tous les messages
      // deux types de room
      if (!isUserInRoom(socket.room, socket.user)) {
        addUserToRoom(socket.room, socket.user);
      }
      console.log("call");
      console.log("callee(appelant) " + data.name);
      console.log("socket user " + socket.user);
      let callee = data.name;
      let rtcMessage = data.rtcMessage;

      console.log("rtcMessages length => " + rtcMessages.length);

      // REMOTE MESSAGE APPELANT celui qui répond recup le rtcMessage de l'appelant et des autres gens si ils ont repondu
      socket.broadcast.to(callee).emit("newCall", {
        caller: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("answerCall", (data: any) => {
      // le répondant tous les messages
      console.log("answer call");
      console.log("caller (appelant)" + data.caller);
      console.log("socket user " + socket.user);
      joinUserAlreadyPresentInRoom(socket, {
        otherUser: data.caller,
        room: socket.room,
      });
      if (!isUserInRoom(socket.room, socket.user)) {
        addUserToRoom(socket.room, socket.user);
      }
      // REMOTE MESSAGE APPELE celui qui répond envoie son rtcMessage à l'appelant
      let caller = data.caller;
      const rtcMessage = data.rtcMessage;

      console.log("rtcMessages length => " + rtcMessages.length);
      socket.to(caller).emit("callAnswered", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });

      /*socket.to(caller + "-connected").emit("callAnswered", {
                callee: socket.user,
                rtcMessage: rtcMessage
            })*/
    });

    socket.on("ICEcandidate", (data: any) => {
      console.log("ice candidate call");
      console.log("otherUser: " + data.user);
      console.log("user: " + socket.user);
      let otherUser = data.user;
      let rtcMessage = data.rtcMessage;

      socket.to(otherUser).emit("ICEcandidate", {
        sender: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("disconnect", () => {
      console.log(socket.user, "Disconnected");
      removeUserFromRoom(socket.room, socket.user);
      socket.broadcast.to(socket.room).emit("userDisconnected", {
        user: socket.user
      });
      socket.leave(socket.user);
      socket.leave(socket.room);
    });
  });
};

export const addUserToRoom = (room: string, user: string) => {
  const users = roomToUsers.get(room) ?? [];
  roomToUsers.set(room, [...users, user]);
  console.log("addUserToRoom " + user);
  console.log(roomToUsers);
};

export const removeUserFromRoom = (room: string, user: string) => {
  const users = roomToUsers.get(room) ?? [];
  roomToUsers.set(
    room,
    users.filter((u) => u !== user)
  );
  console.log("removeUserFromRoom " + user);
  console.log(roomToUsers);
};

// user in in room
export const isUserInRoom = (room: string, user: string) => {
  const users = roomToUsers.get(room) ?? [];
  return users.includes(user);
};

export const joinUserAlreadyPresentInRoom = (socket: any, data: any) => {
  console.log("joinUserAlreadyPresentInRoom");
  console.log(roomToUsers);
  console.log(data);
  let users = roomToUsers.get(data.room);
  if (users?.includes(socket.user)) return;
  console.log(users);
  if (users && users.length > 1) {
    console.log(users);
    console.log(roomToUsers);
    console.log(socket.user);
    users = users.filter((user: string) => {
      console.log("in filter");
      console.log(user);
      console.log(socket.user);
      console.log(data.otherUser);

      return user !== data.otherUser;
    });
    console.log("joinUserAlreadyPresentInRoom");
    console.log(users);
    socket.emit("getAllUsersToJoin", users ?? []);
  }
};

export const getIO = () => {
  if (!IO) {
    throw Error("IO not initilized.");
  } else {
    return IO;
  }
};
