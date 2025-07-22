const { igdl } = require("btch-downloader");
const mess = require("@mess");
const { logCustom } = require("@lib/logger");
const { downloadToBuffer } = require("@lib/utils");
/**
 * Mengirim pesan dengan kutipan
 * @param {object} sock - Objek koneksi WebSocket
 * @param {string} remoteJid - ID pengguna tujuan
 * @param {object} message - Pesan asli yang dikutip
 * @param {string} text - Pesan teks yang dikirim
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Memvalidasi apakah URL yang diberikan adalah URL Instagram yang valid
 * @param {string} url - URL yang akan divalidasi
 * @returns {boolean} True jika valid, false jika tidak
 */
function isIGUrl(url) {
  return /instagram\.com/i.test(url);
}

/**
 * Fungsi utama untuk menangani permintaan unduhan media Instagram
 * @param {object} sock - Objek koneksi WebSocket
 * @param {object} messageInfo - Informasi pesan termasuk konten dan pengirim
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validasi input: pastikan konten ada dan URL valid
    if (!content?.trim() || !isIGUrl(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } https://www.instagram.com/xxx*_`
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Panggil API igdl untuk mendapatkan media
    const response = await igdl(content);

    if (!response || response.length === 0) {
      throw new Error("Tidak ada media yang ditemukan pada URL tersebut.");
    }

    // Ambil media pertama dari respons
    const firstMedia = response[0];
    const urlMedia = firstMedia.url;

    // Download file ke buffer
    const audioBuffer = await downloadToBuffer(urlMedia, "mp4");

    await sock.sendMessage(
      remoteJid,
      { image: audioBuffer, caption: mess.general.success },
      { quoted: message }
    );
  } catch (error) {
    console.error("Kesalahan saat memproses Instagram:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Kirim pesan kesalahan yang lebih deskriptif
    const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n*Detail Kesalahan:* ${
      error.message || "Kesalahan tidak diketahui"
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["igfoto", "instagramfoto"], // Perintah yang didukung oleh handler ini
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
