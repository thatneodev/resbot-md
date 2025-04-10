const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command } = messageInfo;
    try {
        let commands = command;
        if (commands == 'quote' || commands == 'quotes') {
            commands = 'randomquote'
        }

        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get(`/api/random/${commands}`);

        await sock.sendMessage(
            remoteJid,
            { text: response.data },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error.message);
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n*Detail Kesalahan:* ${error.message || "Kesalahan tidak diketahui"}`;
        await sock.sendMessage(
            remoteJid,
            { text: errorMessage },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['animequotes', 'bucinquote', 'dilanquote', 'faktaunik', 'jawaquote', 'jokes', 'motivasi', 'pantun', 'quote', 'quotes', 'randomquote'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
