const mess                      = require('@mess');
const { addFiturBlock }         = require("@lib/group");
const { getGroupMetadata }      = require("@lib/cache");
const { sendMessageWithMention } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, content, prefix, command, mentionedJid } = messageInfo;

    if (!isGroup) return; // Only Grub

    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }


    if (!content) {
        return await sock.sendMessage(
            remoteJid,
            { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} pin*_` },
            { quoted: message }
        );
    }


    try {
        await addFiturBlock(remoteJid, content.trim())
        await sendMessageWithMention(sock, remoteJid,  `_Fitur *${content}* Berhasil di ban untuk grub ini_\n\n_Untuk membuka fitur ketik *.unbanfitur*_`, message);
    
    } catch (error) {
        console.log(error)
        await sendMessageWithMention(sock, remoteJid,  `❌ _Tidak dapat ban nomor_ @${whatsappJid.split('@')[0]}`, message);
    }
}

module.exports = {
    handle,
    Commands    : ['banfitur'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
