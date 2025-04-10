const ApiAutoresbot     = require('api-autoresbot');
const config            = require("@config");
const api               = new ApiAutoresbot(config.APIKEY);
const { logCustom }     = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {

        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} siapa kamu*_` }, { quoted: message });
        }

        // Loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });


        // Memanggil API dengan penanganan kesalahan dan pengecekan respons
        const response = await api.get('/api/simi', { text: content, language: 'id' });
        
        if (response && response.data) {
            // Mengirim pesan jika data dari respons tersedia
            await sock.sendMessage(remoteJid, { text: response.data }, { quoted: message });
        } else {
            // Mengirim pesan default jika respons data kosong atau tidak ada
            await sock.sendMessage(remoteJid, { text: "Maaf, tidak ada respons dari server." }, { quoted: message });
        }
    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        
       // Memberi tahu pengguna jika ada kesalahan
        await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n${error}` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['simi'],
    OnlyPremium     : false, 
    OnlyOwner       : false,
    limitDeduction  : 1
};
