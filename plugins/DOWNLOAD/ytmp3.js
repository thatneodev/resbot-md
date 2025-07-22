const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { extractLink } = require("@lib/utils");
const { logCustom } = require("@lib/logger");
const { downloadToBuffer } = require("@lib/utils");

// Fungsi untuk mengirim pesan dengan kutipan (quote)
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Fungsi utama untuk menangani permintaan
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const validLink = extractLink(content);

    // Validasi input: pastikan konten ada
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } https://www.youtube.com/watch?v=xxxxx*_`
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Inisialisasi API dengan APIKEY dari config
    const api = new ApiAutoresbot(config.APIKEY);

    // Memanggil API untuk mengunduh audio
    const response = await api.get("/api/downloader/ytplay", {
      url: validLink,
      format: "m4a",
    });

    // Validasi respons API
    if (response.status && response.url) {

      // Download file ke buffer
       const audioBuffer = await downloadToBuffer(response.url, 'mp3');

      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      // Jika tidak ada URL untuk audio, beri tahu pengguna
      await sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Maaf, tidak dapat menemukan audio dari URL yang Anda berikan."
      );
    }
  } catch (error) {
    // Tangani kesalahan dan log error
    console.error("Kesalahan saat memanggil API Autoresbot:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Kirim pesan kesalahan yang lebih informatif
    const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["ytmp3"], // Menentukan perintah yang diproses oleh handler ini
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
