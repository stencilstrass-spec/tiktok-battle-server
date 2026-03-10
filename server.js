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
let currentUsername = "";

app.get("/", (req, res) => {
  res.send("Servidor TikTok Battle ativo");
});

app.get("/status", (req, res) => {
  res.json({ connected, username: currentUsername });
});

io.on("connection", (socket) => {
  console.log("Overlay conectado");

  // Se já conectado, avisa o novo client
  if (connected && currentUsername) {
    socket.emit("tiktok-connected", currentUsername);
  }

  socket.on("connect-tiktok", async (username) => {
    // Se já conectado ao mesmo user, só confirma
    if (connected && currentUsername === username) {
      socket.emit("tiktok-connected", username);
      return;
    }

    // Se conectado a outro, desconecta primeiro
    if (connected && tiktok) {
      tiktok.disconnect();
      tiktok = null;
      connected = false;
    }

    console.log("Conectando ao TikTok:", username);
    tiktok = new WebcastPushConnection(username);

    try {
      await tiktok.connect();
      connected = true;
      currentUsername = username;
      console.log("✅ Conectado à live de", username);

      // AVISA O FRONTEND QUE CONECTOU
      io.emit("tiktok-connected", username);

      tiktok.on("gift", (data) => {
        if (data.giftType === 1 && !data.repeatEnd) return;
        console.log("🎁 Gift:", data.giftName, "de", data.uniqueId);
        io.emit("gift", {
          uniqueId: data.uniqueId,
          giftName: data.giftName,
          repeatCount: data.repeatCount,
          profilePictureUrl: data.profilePictureUrl,
          giftPictureUrl: data.giftPictureUrl
        });
      });

      tiktok.on("disconnected", () => {
        console.log("❌ Live desconectada");
        connected = false;
        currentUsername = "";
        tiktok = null;
        io.emit("tiktok-error", "Live desconectada");
      });

    } catch (err) {
      console.log("❌ Erro ao conectar:", err.message);
      connected = false;
      currentUsername = "";
      tiktok = null;
      // AVISA O FRONTEND DO ERRO
      socket.emit("tiktok-error", err.message || "Erro ao conectar");
    }
  });

  // DESCONECTAR TIKTOK POR SOLICITAÇÃO DO ADMIN
  socket.on("disconnect-tiktok", () => {
    console.log("🔌 Desconectando TikTok por solicitação do admin");
    if (tiktok) {
      tiktok.disconnect();
      tiktok = null;
    }
    connected = false;
    currentUsername = "";
    io.emit("tiktok-error", "TikTok desconectado pelo admin");
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
