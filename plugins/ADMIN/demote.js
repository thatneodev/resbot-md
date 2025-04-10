// DEMOTE: Menurunkan admin ke user biasa
const mess = require("@mess");
const { sendMessageWithMention, determineUser } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, mentionedJid, content, isQuoted, prefix, command } = messageInfo;
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

        const userToDemote = determineUser(mentionedJid, isQuoted, content);
        if (!userToDemote) {
            return await sock.sendMessage(
                remoteJid,
                { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        // Proses demote
        await sock.groupParticipantsUpdate(remoteJid, [userToDemote], 'demote');
    
        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid,  `@${userToDemote.split('@')[0]} _telah diturunkan dari admin._`, message);

    } catch (error) {
        console.error("Error in demote command:", error);

        // Kirim pesan kesalahan
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mencoba menurunkan admin.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['demote'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
