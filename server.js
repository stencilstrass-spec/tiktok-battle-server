const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let tiktokConnection = null;

io.on('connection', (socket) => {
  console.log("Overlay conectado");

  socket.on('connect-tiktok', (username) => {

    if (tiktokConnection) {
      tiktokConnection.disconnect();
    }

    tiktokConnection = new WebcastPushConnection(username);

    tiktokConnection.connect()
      .then(() => {
        console.log("Conectado ao TikTok:", username);
        socket.emit("tiktok-connected", username);
      })
      .catch(err => {
        socket.emit("tiktok-error", err.message);
      });

    tiktokConnection.on('gift', data => {

      io.emit("gift", {
        username: data.uniqueId,
        giftName: data.giftName,
        diamondCount: data.diamondCount,
        repeatCount: data.repeatCount,
        profilePicture: data.profilePictureUrl
      });

    });

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
