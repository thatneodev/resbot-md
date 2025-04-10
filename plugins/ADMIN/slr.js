const mess                  = require('@mess');
const { addSlr }            = require("@lib/slr");
const { getGroupMetadata }  = require("@lib/cache");

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
            { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} admin sedang slow respon*_\n\n_Untuk mematikan fitur ini ketik *.slr off*_` },
            { quoted: message }
        );
    }

    if(content.toLowerCase() == 'off') {
        await addSlr(remoteJid, false, '')
        return await sock.sendMessage(
            remoteJid,
            { text:  `✅ _Slr berhasil dimatikan_` },
            { quoted: message }
        );
    }else {
        await addSlr(remoteJid, true, content.trim())
        return await sock.sendMessage(
            remoteJid,
            { text:  `✅ _Slr berhasil di Set_` },
            { quoted: message }
        );
    }

}

module.exports = {
    handle,
    Commands    : ['slr'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
