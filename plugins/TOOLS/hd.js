const {
  downloadQuotedMedia,
  downloadMedia,
  reply,
  uploadTmpFile,
  downloadToBuffer,
} = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const mess = require("@mess");
const config = require("@config");

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command, type, isQuoted } =
    messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;
    if (mediaType !== "image") {
      return await reply(
        m,
        `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`
      );
    }

    // Tampilkan reaksi "Loading"
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // Download & Upload media
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("File media tidak ditemukan setelah diunduh.");
    }

    const upload = await uploadTmpFile(mediaPath);
    if (upload.status) {
      const url = upload.fileUrl;

      const endpoint_api = `https://api.autoresbot.com/api/tools/remini?apikey=${config.APIKEY}&url=${url}`;
      // Download file ke buffer
      const audioBuffer = await downloadToBuffer(endpoint_api, "jpg");

      await sock.sendMessage(
        remoteJid,
        {
          image: audioBuffer,
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      const errorMessage = `_Terjadi kesalahan saat upload ke gambar._ \n\nERROR : ${error}`;
      await reply(m, errorMessage);
    }
  } catch (error) {
    // Kirim pesan kesalahan yang lebih informatif
    const errorMessage = `_Terjadi kesalahan saat memproses gambar._ \n\nERROR : ${error}`;
    await reply(m, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["hd", "remini"], // Perintah yang diproses oleh handler ini
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
