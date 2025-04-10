const mess  = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, isQuoted, sender } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {
        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }


        // Jika ada pesan yang dikutip, hapus pesan tersebut
        if (isQuoted) {
            await sock.sendMessage(remoteJid, { 
                delete: { 
                    remoteJid, 
                    id: isQuoted.id, 
                    participant: isQuoted.sender 
                } 
            });
        }else {
            await sock.sendMessage(remoteJid,
                { text: '⚠️ _Balas pesan yang mau di hapus_' },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error handling command:", error);
        await sock.sendMessage(remoteJid, { text: "Terjadi kesalahan. Silakan coba lagi." });
    }
}

module.exports = {
    handle,
    Commands    : ['del', 'delete'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
