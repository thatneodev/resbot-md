const ApiAutoresbot = require('api-autoresbot');
const mess          = require('@mess');
const config        = require("@config");
const { getBuffer } = require('@lib/utils');
const sharp         = require('sharp');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command, content } = messageInfo;

    try {
        // Loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get('/api/anime', { method: command });

        // Mengecek jika respons dan data tersedia
        if (response && response.data) {
            const buffer = await getBuffer(response.data);

            // Pastikan buffer adalah gambar
            let imageBuffer;
            const metadata = await sharp(buffer).metadata();

            if (metadata.format === 'gif') {
                // Konversi GIF ke gambar statis (JPEG)
                imageBuffer = await sharp(buffer).toFormat('jpeg').toBuffer();
            } else if (['jpeg', 'png', 'webp'].includes(metadata.format)) {
                // Buffer sudah berupa gambar
                imageBuffer = buffer;
            } else {
                throw new Error('File yang diterima bukan gambar yang valid.');
            }

            logCustom('info', content, `ERROR-COMMAND-ANIME-${command}.txt`);

            // Kirimkan gambar jika respons data valid
            await sock.sendMessage(remoteJid, {
                image: imageBuffer,
                caption: mess.general.success
            }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

            // Pesan jika data kosong
            await sock.sendMessage(remoteJid, {
                text: "Maaf, tidak ada data tersedia untuk permintaan ini."
            }, { quoted: message });
        }
    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        await sock.sendMessage(remoteJid, {
            text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n${error}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: [
        'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo',
        'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive',
        'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'
    ],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};
