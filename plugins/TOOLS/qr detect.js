const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { reply, fetchJson } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, isQuoted, type } = messageInfo;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const mediaType = isQuoted ? isQuoted.type : type;
        if(mediaType != 'image') return await reply(m, `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`);

        const media = isQuoted? await downloadQuotedMedia(message): await downloadMedia(message);
        const mediaPath = path.join("tmp", media);
        if (!fs.existsSync(mediaPath)) {
            throw new Error("File media tidak ditemukan setelah diunduh.");
        }

        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.tmpUpload(mediaPath);
        if (!response || response.code !== 200) {
            throw new Error("File upload gagal atau tidak ada URL.");
        }
    
        const url = response.data.url;

        const res = await fetchJson(`http://api.qrserver.com/v1/read-qr-code/?fileurl=${url}`)
        // Mengakses properti-symbol
        const symbols = res[0].symbol;
        const combinedString = symbols
            .map(symbol => Object.values(symbol).filter(value => value !== 0).join(' '))
            .filter(value => value.trim() !== '')  // Menghapus nilai yang hanya terdiri dari spasi
            .join(' ');

        await reply(m, combinedString);

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
    Commands    : ["detectqr"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
