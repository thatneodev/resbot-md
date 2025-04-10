const ApiAutoresbot = require('api-autoresbot');
const config        = require('@config');
const mess          = require("@mess");
const { extractLink }   = require('@lib/utils');
const { logCustom }     = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {

        const validLink = extractLink(content);

        // Validasi input: pastikan konten ada
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} https://www.youtube.com/watch?v=xxxxx*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get('/api/downloader/ytmp4', { url: validLink });
    
        // Validasi respons API
        if (response.status && response.url) {
                await sock.sendMessage(remoteJid, {
                    video: { url: response.url },
                    caption: mess.general.success,
                }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Jika tidak ada URL untuk audio, beri tahu pengguna
            await sendMessageWithQuote(sock, remoteJid, message, 'Maaf, tidak dapat menemukan audio dari URL yang Anda berikan.');
        }

    } catch (error) {
        // Tangani kesalahan dan log error
        console.error("Kesalahan saat memanggil API Autoresbot:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Kirim pesan kesalahan yang lebih informatif
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['ytmp4'],  // Menentukan perintah yang diproses oleh handler ini
    OnlyPremium : false, 
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
