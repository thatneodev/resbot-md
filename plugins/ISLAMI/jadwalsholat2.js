const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    try {
        const { remoteJid, message, content, prefix, command } = messageInfo;


        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} sambas*_`
            }, { quoted: message });
            return; // Hentikan eksekusi jika tidak ada konten
        }


        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/maker/jadwalsholat`, {
            kota: content
        });

        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error.message);
    }
}

module.exports = {
    handle,
    Commands: ['jadwalsholat2'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
