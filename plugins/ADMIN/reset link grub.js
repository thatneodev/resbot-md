const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender} = messageInfo;
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

        await sock.groupRevokeInvite(remoteJid);
        await sock.sendMessage(remoteJid, { text: mess.action.resetgc }, { quoted: message } );

    } catch (error) {
        console.error("Error in resetlinkgc command:");

        // Kirim pesan kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mereset link grub. Pastikan bot adalah admin' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['resetlinkgc','resetlinkgrup','resetlinkgroup','resetlinkgrub','resetlinkgroub'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
