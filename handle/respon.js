const { getDataByGroupId } = require('@lib/list');
const fs = require('fs').promises;
const config = require("@config");
const chalk = require('chalk');
const { logTracking } = require('@lib/utils');
const lastMessageTime = {};

// Fungsi ini tidak diubah, tetap untuk fitur list respon
async function process(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;
    try {
        const keyword = fullText.trim();
        if (!keyword) return;
        let currentList = await getDataByGroupId('owner');
        if (!currentList) return;
        const searchResult = Object.keys(currentList.list).find(item => 
            item.toLowerCase().trim() === keyword.toLowerCase().trim()
        );
        if (!searchResult) return;

        const { text, media } = currentList.list[searchResult].content;
        const now = Date.now();
        if (lastMessageTime[remoteJid] && (now - lastMessageTime[remoteJid] < config.rate_limit)) {
            console.log(chalk.redBright(`Rate limit respon: ${keyword}`));
            return false;
        }
        lastMessageTime[remoteJid] = now;

        if (media) {
            const buffer = await getMediaBuffer(media);
            if (buffer) {
                const ext = media.split('.').pop().toLowerCase();
                const typeMap = {
                    'webp': 'sticker', 'mp3': 'audio', 'jpg': 'image', 'jpeg': 'image',
                    'png': 'image', 'mp4': 'video', 'mkv': 'video', 'mov': 'video'
                };
                await sendMediaMessage(sock, remoteJid, buffer, text, message, typeMap[ext] || 'unknown');
            } else {
                console.error(`Media tidak ditemukan: ${media}`);
            }
        } else {
            await sendTextMessage(sock, remoteJid, text, message);
        }
        logTracking(`Respon Handler - ${remoteJid}`);
        return false;
    } catch (error) {
        console.error("Error di List Response:", error);
    }
}

async function getMediaBuffer(mediaFileName) {
    const filePath = `./database/media/${mediaFileName}`;
    try {
        return await fs.readFile(filePath);
    } catch (error) {
        console.error(`Gagal membaca media: ${filePath}`, error);
        return null;
    }
}

async function sendMediaMessage(sock, remoteJid, buffer, caption, quoted, typeMedia) {
    try {
        const messageOptions = {};
        if (caption) messageOptions.caption = caption;

        switch (typeMedia) {
            case 'image':
                await sock.sendMessage(remoteJid, { image: buffer, ...messageOptions }, { quoted });
                break;
            case 'video':
                await sock.sendMessage(remoteJid, { video: buffer, ...messageOptions }, { quoted });
                break;
            case 'audio':
                await sock.sendMessage(remoteJid, { audio: buffer, mimetype: 'audio/mp4' }, { quoted });
                break;
            case 'sticker':
                await sock.sendMessage(remoteJid, { sticker: buffer }, { quoted });
                break;
            default:
                console.warn(`Tipe media tidak diketahui: ${typeMedia}`);
                break;
        }
    } catch (error) {
        console.error("Gagal mengirim pesan media:", error);
    }
}

async function sendTextMessage(sock, remoteJid, text, quoted) {
    try {
        await sock.sendMessage(remoteJid, { text }, { quoted });
    } catch (error) {
        console.error("Gagal mengirim pesan teks:", error);
    }
}

// --- PERBAIKAN UTAMA ADA DI SINI ---
// Kita ekspor semua fungsi agar bisa dipakai di file lain (seperti pd.js)
module.exports = {
    name: "List Response",
    priority: 9,
    process, // Tetap diekspor untuk fitur aslinya
    sendTextMessage, // <- FUNGSI INI PERLU DIEKSPOR
    sendMediaMessage, // <- FUNGSI INI PERLU DIEKSPOR
    getMediaBuffer,
};
