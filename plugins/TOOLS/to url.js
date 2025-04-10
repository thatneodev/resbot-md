const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');

async function upload(filePath) {
    try {
        const form = new FormData();
        form.append('expired', '6months'); // 1minute, 1hour, 1day, 1month and 6months
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.put(
            "https://autoresbot.com/tmp-files/upload",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Referer': 'https://autoresbot.com/',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Edg/126.0.0.0'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.log(error)
        return false;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, content, prefix, command } = messageInfo;
    try {

        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image' && mediaType !== 'sticker' ) {
            return await reply(m, `⚠️ _Kirim/Balas gambar/sticker dengan caption *${prefix + command}*_`);
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

        const result = await upload(mediaPath);

        await reply(m, `_Link_  : ${result.fileUrl}\n\n_Expired_ : ${result.expired}`);

    } catch (error) {
        console.error("Error in translation handler:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "Maaf, terjadi kesalahan. Coba lagi nanti!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["tourl"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
