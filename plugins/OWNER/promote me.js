// PROMOTEME: Menjadikan owner ke admin jika bot sudah admin

const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        if(!isGroup) {
            return await sock.sendMessage(remoteJid, { text: mess.general.isGroup }, { quoted: message });
        }

        // Proses demote
        await sock.groupParticipantsUpdate(remoteJid, [sender], 'promote');
    
        // Kirim pesan
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _Berhasil Menjadi Admin_' },
            { quoted: message }
        );


    } catch (error) {
        console.error("Error in promoteme command:");

        // Kirim pesan kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menaikkan menjadi admin. Pastikan Bot Sudah Admin' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['promoteme'],
    OnlyPremium : false,
    OnlyOwner   : true
};
