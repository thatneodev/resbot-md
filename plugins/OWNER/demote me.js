// DEMOTEME: Menjadikan owner ke member jika bot sudah admin

const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        if(!isGroup) {
            return await sock.sendMessage(remoteJid, { text: mess.general.isGroup }, { quoted: message });
        }

        // Proses demote
        await sock.groupParticipantsUpdate(remoteJid, [sender], 'demote');
    
        // Kirim pesan
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _Berhasil Menjadi Member_' },
            { quoted: message }
        );


    } catch (error) {
        console.error("Error in promoteme command:");

        // Kirim pesan kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menurutkan menjadi member. Pastikan Bot Sudah Admin' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['demoteme'],
    OnlyPremium : false,
    OnlyOwner   : true
};
