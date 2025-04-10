// Textpro 2 param

const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");
const { logCustom }     = require("@lib/logger");


async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
    
         // Validasi input konten
        if (!content || content.trim().split(/\s+/).length < 2) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} auto | resbot*_ \n\n_Minimal 2 kata_`
            }, { quoted: message });
            return; // Hentikan eksekusi jika tidak ada konten atau konten kurang dari 2 kata
        }

    
        // Memeriksa apakah ada tanda '|' dalam content
        let text1, text2;
        if (content.includes('|')) {
            // Jika ada '|', pisahkan berdasarkan '|'
            [text1, text2] = content.split('|').map(item => item.trim());
        } else {
            // Jika tidak ada '|', pisahkan berdasarkan spasi
            [text1, ...rest] = content.split(' ');
            text2 = rest.join(' ');
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/textpro/${command}`, {
            text1, text2
        });

        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption:  mess.general.success },
            { quoted: message }
        );
    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-TEXTPRO-${command}.txt`);
        console.error("Error in handle function:", error.message);
    }
}

module.exports = {
    handle,
    Commands    : ['marvel','pornhub'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
