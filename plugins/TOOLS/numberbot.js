const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content } = messageInfo;

    try {
        return reply(m, `_NUMBER BOT :_ *${global.phone_number_bot}*`)
        
    } catch (error) {
        console.error("Error saat memproses grup:", error);

        // Kirim pesan kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['numberbot'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
