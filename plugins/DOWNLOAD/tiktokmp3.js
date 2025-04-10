const { tiktok }            = require('@scrape/tiktok');
const { forceConvertToM4a } = require('@lib/utils');
const { extractLink }       = require('@lib/utils');
const { logCustom }         = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

function isTikTokUrl(url) {
    return /tiktok\.com/i.test(url);
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {

        const validLink = extractLink(content);

        // Validasi input: pastikan konten ada
        if (!content.trim()) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} linknya*_`
            );
        }

        // Validasi URL TikTok
        if (!isTikTokUrl(content)) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                'URL yang Anda masukkan tidak valid. Pastikan URL berasal dari TikTok.'
            );
        }

        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Memanggil API untuk mendapatkan data video TikTok
        const response  = await tiktok(validLink);

        // Validasi response.music
        if (!response || !response.music) {
            console.error("Error: Tidak ada URL musik yang ditemukan dalam response.");
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            return await sock.sendMessage(remoteJid, {
                text: "Gagal mengambil audio dari TikTok. Coba lagi nanti.",
            }, { quoted: message });
        }


        let outputUrl = response.music;

        try {
            // Coba konversi ke format M4A
            outputUrl = await forceConvertToM4a({
                url: response.music
            });
        } catch (error) {
            //console.warn("Peringatan: Gagal mengonversi ke M4A, menggunakan URL asli.", error);
        }

                // Mengirim video tanpa watermark dan caption
        await sock.sendMessage(remoteJid, {
            audio: { url: outputUrl },
            fileName: `tiktok.mp3`,
            mimetype: 'audio/mp4'
        }, { quoted: message });

    } catch (error) {
        console.error("Kesalahan saat memproses perintah TikTok:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Kirim pesan kesalahan yang lebih informatif
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n*Detail Kesalahan:* ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['tiktokmp3','ttmp3'], // Menentukan perintah yang diproses oleh handler ini
    OnlyPremium : false, 
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
