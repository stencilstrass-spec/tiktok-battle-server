const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get("/", (req, res) => {
  res.send("Servidor TikTok Battle ativo");
});

io.on("connection", (socket) => {

  console.log("Overlay conectado");

  socket.on("connect-tiktok", async (username) => {

    console.log("Conectando ao TikTok:", username);

    const tiktok = new WebcastPushConnection(username);

    try {

      await tiktok.connect();
      console.log("Conectado à live");

      tiktok.on("gift", (data) => {

        console.log("Gift recebido:", data.giftName);

     io.emit("gift", {
  uniqueId: data.uniqueId,
  username: data.uniqueId,
  giftName: data.giftName,
  repeatCount: data.repeatCount,
  giftPictureUrl: data.giftPictureUrl?.urlList?.[0] || ""
});

      });

    } catch (err) {

      console.log("Erro:", err);

    }

  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
