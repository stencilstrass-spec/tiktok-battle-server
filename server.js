const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();

app.get('/', (req, res) => {
  res.send("Servidor TikTok Battle ativo");
});

app.get('/connect/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const tiktok = new WebcastPushConnection(username);
    const state = await tiktok.connect();

    console.log(`✅ Conectado à live de @${username}`);

    tiktok.on('gift', (data) => {
      console.log(`🎁 Presente de @${data.uniqueId}: ${data.giftName} x${data.repeatCount}`);
    });

    res.json({
      success: true,
      username: username,
      roomId: state.roomId
    });

  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
