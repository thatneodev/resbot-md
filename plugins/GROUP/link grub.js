const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        // Periksa apakah perintah dijalankan di grup
        if (!isGroup) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.general.isGroup },
                { quoted: message }
            );
        }

        // Mendapatkan metadata grup
        const groupMetadata     = await getGroupMetadata(sock, remoteJid);
        const groupInviteCode   = await sock.groupInviteCode(remoteJid);

        // Membuat teks balasan
        const text = `https://chat.whatsapp.com/${groupInviteCode}`;

        // Mengirimkan balasan
        return await sock.sendMessage(
            remoteJid,
            { text },
            { quoted: message }
        );

    } catch (error) {
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Terjadi kesalahan saat menampilkan tautan grup._ \n\n_Pastikan Bot sudah menjadi admin_' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['linkgrup', 'linkgroup', 'linkgc', 'linkgrub', 'linkgroub'],
    OnlyPremium : false,
    OnlyOwner   : false
};
