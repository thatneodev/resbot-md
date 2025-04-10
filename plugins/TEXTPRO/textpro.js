// Textpro 1 param

const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");
const { logCustom }     = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    try {
         // Validasi input konten
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_`
            }, { quoted: message });
            return; // Hentikan eksekusi jika tidak ada konten
        }
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/textpro/${command}`, {
            text: content,
            orientasi : 'potrait'
        });

        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption:  mess.general.success },
            { quoted: message }
        );
    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        console.error("Error in handle function:", error.message);
    }
}

module.exports = {
    handle,
    Commands    : ['3dbox','blackpink','boom','gaming','magma','matrix','metal','neon','shadow','signature','sliced','snow','valentine','winter','wolf'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
