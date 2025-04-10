const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const { logCustom }     = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command, content } = messageInfo;

    try {
        // Memberikan reaksi saat memproses
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Membuat instance API dengan API key dari konfigurasi
        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API berdasarkan perintah yang diberikan
        const response = await api.get(`/api/news/${command}`);
        
        if (response && response.data && response.data.posts && response.data.posts.length > 0) {
            const { link , title, description, thumbnail: image } = response.data.posts[0];
            const fulltext = `${title} \n\n${description} \n${link}`;

            // Mengirim pesan dengan gambar dan keterangan jika data tersedia
            await sock.sendMessage(remoteJid, { image: { url: image }, caption: fulltext }, { quoted: message });
        } else {
            // Mengirim pesan default jika respons data kosong atau tidak ada
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            await sock.sendMessage(remoteJid, { text: "Maaf, tidak ada respons dari server." }, { quoted: message });
        }
    } catch (error) {
        
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // Memberi tahu pengguna jika terjadi kesalahan
        await sock.sendMessage(remoteJid, { text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n${error}` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['antara','cnn', 'cnbc', 'jpnn','kumparan','merdeka','okezone','republika', 'sindonews','tempo', 'tribun'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};

