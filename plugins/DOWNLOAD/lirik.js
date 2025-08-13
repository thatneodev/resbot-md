const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(
  sock,
  remoteJid,
  message,
  text,
  options = {}
) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validasi input
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } matahariku*_`
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Inisialisasi API
    const api = new ApiAutoresbot(config.APIKEY);

    // Memanggil API dengan parameter
    const response = await api.get("/api/search/lyrics", { text: content });

    // Menangani respons API
    if (response.code === 200 && response.data) {
      const { artist, title, lyrics, image } = response.data;
      const lirikData = `_*Artist:*_ *${artist}*\n\n_*Title:*_ *${title}*\n\n${lyrics}`;

      // Kirimkan gambar dan lirik
      await sock.sendMessage(
        remoteJid,
        { image: { url: image }, caption: lirikData },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      // Menangani kasus jika respons tidak sesuai atau kosong
      const errorMessage =
        response?.message ||
        "Maaf, tidak ada respons dari server. Silakan coba lagi nanti.";
      await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
    // Menangani kesalahan dan mengirim pesan ke pengguna
    const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["lirik"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
