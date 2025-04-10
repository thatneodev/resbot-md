const { sendMessageWithMention } = require('@lib/utils');
const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
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
    
        // Daftar semua anggota grup
        const memberList = participants
            .map((member, index) => `◧ @${member.id.split('@')[0]}`)
            .join('\n');

        // Cek jika tidak ada anggota
        if (!memberList) {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _Tidak ada anggota dalam grup ini._' },
                { quoted: message }
            );
        }

        // Teks notifikasi daftar anggota
        const textNotif = `📋 *Daftar Semua Anggota Grup: ${participants.length}*\n\n${memberList}`;

        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid, textNotif, message);
    } catch (error) {
        console.error('Error handling listalluser:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat menampilkan semua anggota grup.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['listalluser'],
    OnlyPremium : false,
    OnlyOwner   : false,
};
