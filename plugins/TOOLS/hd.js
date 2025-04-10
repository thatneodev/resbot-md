const { ReminiV1 } = require('@scrape/remini');
const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command, type, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_`);
        }

        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Download & Upload media
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('File media tidak ditemukan setelah diunduh.');
        }

        // Membaca file menjadi Buffer
        const mediaBuffer = fs.readFileSync(mediaPath);
        // Proses menggunakan ReminiV1
        const result = await ReminiV1(mediaBuffer);

        await sock.sendMessage(
            remoteJid,
            {
                image: result,
                caption: mess.general.success,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error('Kesalahan saat memproses perintah Hd:', error);

        // Kirim pesan kesalahan yang lebih informatif
        const errorMessage = `_Terjadi kesalahan saat memproses gambar._\n\nCoba gunakan *${prefix + command}2*`;
        await reply(m, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['hd', 'remini'], // Perintah yang diproses oleh handler ini
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};