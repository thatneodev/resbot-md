const ApiAutoresbot     = require('api-autoresbot');
const config            = require("@config");
const mess              = require("@mess");
const { extractLink }   = require('@lib/utils');
const { logCustom }     = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {
        const validLink = extractLink(content);

        // Validasi input
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} https://twitter.com/gofoodindonesia/status/1229369819511709697*_`);
        }
        
        // Tampilkan reaksi "Loading"
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Inisialisasi API
        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API dengan parameter
        const response = await api.get('/api/downloader/twitter', { url: validLink });


        // Menangani respons API
        if (response?.data?.media) {
            const urlDownload = response.data.media[0].url;

            await sock.sendMessage(remoteJid, { video: { url:urlDownload }, caption: mess.general.success, mimetype: 'video/mp4' })

        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Pesan jika respons data kosong atau gagal
            await sendMessageWithQuote(sock, remoteJid, message, "Maaf, tidak ada respons dari server. Silakan coba lagi nanti.");
        }
    } catch (error) {
        console.error("Kesalahan saat memanggil API Autoresbot:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Menangani kesalahan dan mengirim pesan ke pengguna
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\nDetail Error: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['tw','twitter'],
    OnlyPremium : false, 
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
