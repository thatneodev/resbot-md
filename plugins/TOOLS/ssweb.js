const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const { isURL }     = require("@lib/utils");
const mess          = require('@mess');
const { logCustom } = require("@lib/logger");

async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validasi input
        if (!content.trim() || content.trim() == '' || !isURL(content)) {
            return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} https://google.com*_`);
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Inisialisasi API
        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API dengan parameter
        const buffer = await api.getBuffer('/api/ssweb', { 
            url: content,
            delay : 6000 // 6 detik
        });

        await sock.sendMessage( remoteJid,{
                image: buffer,
                caption: mess.general.success,
            },{ quoted: message }
        );

    } catch (error) {
        console.error("Kesalahan di fungsi handle:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

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
    Commands    : ["ssweb"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
