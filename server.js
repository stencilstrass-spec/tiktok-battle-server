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
        // Log completo para debug — remova depois de confirmar
        console.log("RAW GIFT:", JSON.stringify(data, null, 2));

        const giftPic =
          (typeof data.giftPictureUrl === 'string' && data.giftPictureUrl) ||
          data.giftPictureUrl?.urlList?.[0] ||
          data.gift?.picture?.urlList?.[0] ||
          data.giftPicture?.urlList?.[0] ||
          data.image?.urlList?.[0] ||
          "";

        const profilePic =
          (typeof data.profilePictureUrl === 'string' && data.profilePictureUrl) ||
          data.profilePictureUrl?.urlList?.[0] ||
          data.userDetails?.profilePictureUrl ||
          "";

        io.emit("gift", {
          uniqueId: data.uniqueId,
          username: data.uniqueId,
          profilePicture: profilePic,
          giftName: data.giftName,
          repeatCount: data.repeatCount,
          giftPictureUrl: giftPic
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
