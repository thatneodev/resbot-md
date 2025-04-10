const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function sendMessage(sock, remoteJid, text, message) {
    try {
        await sock.sendMessage(remoteJid, { text }, { quoted: message });
    } catch (error) {
        console.error(`Failed to send message: ${error.message}`);
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, command } = messageInfo;

    if (!isGroup) {
        await sendMessage(sock, remoteJid, mess.general.isGroup, message);
        return;
    }

    try {
        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const isAdmin = groupMetadata.participants.some(
            participant => participant.id === sender && participant.admin
        );

        if (!isAdmin) {
            await sendMessage(sock, remoteJid, mess.general.isAdmin, message);
            return;
        }

        const responseText = `
_Mode ${command}_

*Ketik: .on ${command}*

_Noted!_
Antilink: hapus pesan
Antilinkv2: hapus pesan + kick member

Antilinkwa: hapus pesan (link WA)
Antilinkwav2: hapus pesan + kick (link WA)
`;
        await sendMessage(sock, remoteJid, responseText.trim(), message);
    } catch (error) {
        console.error(`Error in handle function: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['antilink'],
    OnlyPremium: false,
    OnlyOwner: false,
};
