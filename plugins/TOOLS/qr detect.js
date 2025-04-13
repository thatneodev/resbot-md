const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { reply } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, isQuoted, type } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const mediaType = isQuoted ? isQuoted.type : type;
        if(mediaType !== 'image') {
            return await reply(m, `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`);
        }

        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join("tmp", media);
        
        if (!fs.existsSync(mediaPath)) {
            throw new Error("File media tidak ditemukan setelah diunduh.");
        }

        const img = await Jimp.read(mediaPath);
        const qr = new QrCode();

        const qrResult = await new Promise((resolve, reject) => {
            qr.callback = (err, value) => {
                if (err) return reject("❌ QR Code tidak terdeteksi dalam gambar.");
                resolve(value.result);
            };
            qr.decode(img.bitmap);
        });

        await reply(m, `✅ QR Code Terdeteksi:\n${qrResult}`);

        // Opsional: hapus file jika sudah tidak diperlukan
        fs.unlinkSync(mediaPath);

    } catch (error) {
        console.error("Kesalahan dalam fungsi handle:", error);

        const errorMessage = error.message || "Terjadi kesalahan tak dikenal.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["detectqr"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1,
};
