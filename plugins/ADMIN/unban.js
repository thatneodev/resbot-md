const mess                      = require('@mess');
const { removeUserFromBlock }   = require("@lib/group");
const { getGroupMetadata }      = require("@lib/cache");
const { sendMessageWithMention, determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command, mentionedJid, isQuoted } = messageInfo;

    if (!isGroup) return; // Only Grub

    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Menentukan pengguna yang akan dikeluarkan
    const userToBan = determineUser(mentionedJid, isQuoted, content);
    if (!userToBan) {
        return await sock.sendMessage(
            remoteJid,
            { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 6285246154386*_` },
            { quoted: message }
        );
    }
    const whatsappJid = userToBan;

    try {
        const result = await removeUserFromBlock(remoteJid, whatsappJid);
        if(result) {
            await sendMessageWithMention(sock, remoteJid,  `✅ @${whatsappJid.split('@')[0]} _Berhasil di unban untuk grub ini_`, message);

        }else {
            await sendMessageWithMention(sock, remoteJid,  `⚠️ @${whatsappJid.split('@')[0]} _Tidak di temukan di list ban_`, message);
        }
        
    } catch (error) {
        console.log(error)
        await sendMessageWithMention(sock, remoteJid,  `❌ _Tidak dapat unban nomor_ @${whatsappJid.split('@')[0]}`, message);
    }
}

module.exports = {
    handle,
    Commands    : ['unban'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
