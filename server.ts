import { Server } from 'socket.io';

let IO: any;

export const initIO = (httpServer: Server) => {
    IO = require('socket.io')(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

    IO.use((socket: any, next: any) => {
        if (socket.handshake.query) {
            console.log("middleware");
            console.log(socket.handshake.query);
            let userName = socket.handshake.query.user
            socket.user = userName;
            next();
        }
    })

    IO.on('connection', (socket: any) => {
        console.log(socket.user, "Connected");
        socket.join(socket.user);

        socket.on('call', (data: any) => {
            console.log("call");
            console.log(data.name);
            let callee = data.name;
            let rtcMessage = data.rtcMessage;
            socket.to(callee).emit("newCall", {
                caller: socket.user,
                rtcMessage: rtcMessage
            })

        })

        socket.on('answerCall', (data: any) => {
            console.log("answer call");
            console.log(data);
            let caller = data.caller;
            const rtcMessage = data.rtcMessage

            socket.to(caller).emit("callAnswered", {
                callee: socket.user,
                rtcMessage: rtcMessage
            })

        })

        socket.on('ICEcandidate', (data: any) => {
            console.log("ice candidate call");
            console.log(data);
            let otherUser = data.user;
            let rtcMessage = data.rtcMessage;

            socket.to(otherUser).emit("ICEcandidate", {
                sender: socket.user,
                rtcMessage: rtcMessage
            })
        })
    })

}

export const getIO = () => {
    if (!IO) {
        throw Error("IO not initilized.")
    } else {
        return IO;
    }
}