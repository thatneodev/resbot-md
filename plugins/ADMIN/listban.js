const mess  = require('@mess');
const { getUserBlockList } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;

    if (!isGroup) return; // Only Grub

    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    try {
        const listBaned = await getUserBlockList(remoteJid);

        if (listBaned.length > 0) {
            // Membuat daftar anggota yang di-ban dalam format yang diinginkan
            const memberList = listBaned
                .map(member => `◧ @${member.split('@')[0]}`)
                .join('\n');

        const textNotif = `📋 *LIST BAN: ${listBaned.length}*\n\n${memberList}`;
         await sendMessageWithMention(sock, remoteJid, textNotif, message);

        } else {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _Tidak ada anggota yang di ban_' },
                { quoted: message }
            );
        }
      
    } catch (error) {
        console.error("Error handling listban command:", error);
        return await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses permintaan Anda." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['listban'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
