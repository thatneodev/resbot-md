const { reply, isURL } = require("@lib/utils");
const axios     = require("axios");
const ApiAutoresbot = require("api-autoresbot");
const config    = require("@config");
const mess      = require("@mess");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;


    try {
        
        // Validasi input
        if (!content || !isURL(content)) {
            return await reply(m, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _${prefix + command} https://autoresbot.com_`);
        }
        
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        
        // Memeriksa host menggunakan API
        const response = await axios.get('https://check-host.net/check-ping', {
            params: {
                host: content,
                max_nodes: 3
            },
            headers: {
                'Accept': 'application/json'
            }
        });

        const responseData = response.data;
        if (!responseData.ok) {
            return await reply(m, "Gagal memeriksa host.");
        }

        const permanentLink = responseData.permanent_link;

        // Inisialisasi dan panggil API Autoresbot
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer("/api/ssweb", {
            url: permanentLink,
            delay: 6000, // 6 detik
        });

        // Kirim pesan dengan tangkapan layar
        await sock.sendMessage(
            remoteJid,
            {
                image: buffer,
                caption: mess.general.success,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Kesalahan dalam fungsi handle:", error);

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
    Commands    : ["cekdns"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
