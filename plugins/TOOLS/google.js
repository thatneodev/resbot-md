const ApiAutoresbot = require('api-autoresbot');
const config = require('@config');
const { logCustom }     = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} autoresbot*_` },
                { quoted: message }
            );
        }

        // Mengirimkan reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: '⏰', key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API
        const response = await api.get('/api/search/bingsearch', { q : content });

        if (response?.data) {

            let messageText = "*Search Result:*\n\n";
            response.data.forEach((item, index) => {
                messageText += `◧ *${item.title}*\n`;
                messageText += `◧ URL: ${item.url}\n`;
                messageText += `◧ Deskripsi: ${item.description}\n\n`;
            });
            // Mengirimkan data yang diperoleh
            await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Respons kosong atau tidak ada data
            await sock.sendMessage(remoteJid, { text: 'Maaf, tidak ada respons dari server.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Penanganan kesalahan dengan pesan ke pengguna
        await sock.sendMessage(
            remoteJid,
            { text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nDetail: ${error.message || error}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['google'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1
};
