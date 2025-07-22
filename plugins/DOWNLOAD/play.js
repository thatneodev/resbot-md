const yts           = require('yt-search');
const ApiAutoresbot = require('api-autoresbot');
const config        = require('@config');
const { logCustom } = require("@lib/logger");
const { downloadToBuffer } = require("@lib/utils");


// Fungsi untuk mengirim pesan dengan kutipan (quote)
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

// Fungsi untuk mengirim reaksi
async function sendReaction(sock, message, reaction) {
    return sock.sendMessage(message.key.remoteJid, { react: { text: reaction, key: message.key } });
}

// Fungsi untuk melakukan pencarian YouTube
async function searchYouTube(query) {
    const searchResults = await yts(query);
    return searchResults.all.find(item => item.type === 'video') || searchResults.all[0];
}

// Fungsi utama untuk menangani perintah
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} matahariku*_`
            );
        }

        // Tampilkan reaksi "Loading"
        await sendReaction(sock, message, "⏰");

        // Pencarian YouTube
        const video = await searchYouTube(query);

        if (!video || !video.url) {
            return sendMessageWithQuote(sock, remoteJid, message, '⛔ _Tidak dapat menemukan video yang sesuai_');
        }

        if (video.seconds > 3600) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                '_Maaf, video terlalu besar untuk dikirim melalui WhatsApp._'
            );
        }

        // Kirim informasi video
        const caption = `*YOUTUBE DOWNLOADER*\n\n◧ Title: ${video.title}\n◧ Duration: ${video.timestamp}\n◧ Uploaded: ${video.ago}\n◧ Views: ${video.views}\n◧ Description: ${video.description}`;
        
        // Inisialisasi API dan unduh file
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get('/api/downloader/ytplay', { 
            url: video.url,
            format : 'm4a'
        });
        

        if (response && response.status) {

            // Kirim image 
            await sock.sendMessage(
                remoteJid,
                { image: { url: video.thumbnail }, caption },
                { quoted: message }
            );

            
                    // Download file ke buffer
                   const audioBuffer = await downloadToBuffer(response.url, 'mp3');

                    await sock.sendMessage(
                        remoteJid,
                        {
                            audio: audioBuffer,
                            fileName: `yt.mp3`,
                            mimetype: 'audio/mp4',
                        },
                        { quoted: message }
                    );
        } else {
            await sendReaction(sock, message, "❗");
        }
    } catch (error) {
        console.error("Error while handling command:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        const errorMessage = `⚠️ Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n💡 Detail: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['play'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
