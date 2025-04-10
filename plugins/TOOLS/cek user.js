const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validasi input
        if (!content) {
            return await reply(m, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _${prefix + command} 6285246154386_`);
        }

        const phoneNumber = content.trim();

        // Validasi apakah input adalah angka dan panjangnya sesuai
        if (!/^\d{10,15}$/.test(phoneNumber)) {
            return await reply(m, `_Nomor yang Anda masukkan tidak valid. Harap masukkan nomor dengan format internasional tanpa tanda plus (+)._`);
        }

        const userJid = `${phoneNumber}@s.whatsapp.net`;

        // Mengecek apakah nomor terdaftar di WhatsApp
        const result = await sock.onWhatsApp(userJid);

        if (result && result.length > 0 && result[0].exists) {
            return await reply(m, `_Nomor ${phoneNumber} terdaftar di WhatsApp._`);
        } else {
            return await reply(m, `_Nomor ${phoneNumber} tidak ditemukan di WhatsApp._`);
        }
    } catch (error) {
        console.error("Kesalahan di fungsi handle:", error);

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
    Commands    : ["cekuser"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
