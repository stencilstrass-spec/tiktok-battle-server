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

  // Ignora gifts que ainda estão sendo repetidos
  if (data.giftType === 1 && !data.repeatEnd) {
    return;
  }

  console.log("Gift confirmado:", data.giftName);

  io.emit("gift", {
    uniqueId: data.uniqueId,
    giftName: data.giftName,
    repeatCount: data.repeatCount
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
