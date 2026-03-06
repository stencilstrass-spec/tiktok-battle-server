const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let tiktok = null;
let connected = false;

app.get("/", (req, res) => {
  res.send("Servidor TikTok Battle ativo");
});

io.on("connection", (socket) => {

  console.log("Overlay conectado");

  socket.on("connect-tiktok", async (username) => {

    if (connected) {
      console.log("TikTok já conectado");
      return;
    }

    console.log("Conectando ao TikTok:", username);

    tiktok = new WebcastPushConnection(username);

    try {

      await tiktok.connect();

      connected = true;

      console.log("Conectado à live!");

      // EVENTO DE GIFT
      tiktok.on("gift", (data) => {

        // IGNORA EVENTOS DE COMBO INTERMEDIÁRIOS
        if (data.giftType === 1 && !data.repeatEnd) {
          return;
        }

        console.log("Gift recebido:", data.giftName, "x", data.repeatCount);

        io.emit("gift", {
          uniqueId: data.uniqueId,
          giftName: data.giftName,
          repeatCount: data.repeatCount
        });

      });

      // QUANDO LIVE DESCONECTA
      tiktok.on("disconnected", () => {

        console.log("Live desconectada");

        connected = false;
        tiktok = null;

      });

    } catch (err) {

      console.log("Erro ao conectar:", err);

    }

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
