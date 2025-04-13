const { sendMessageWithMention }  = require('@lib/utils');
const mess                        = require('@mess');
const { getActiveUsers }          = require("@lib/users");
const { getGroupMetadata }        = require("@lib/cache");
const TOTAL_HARI_SIDER            = 30; // total sider maksimum tidak aktif 30 hari

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {
        // Mendapatkan metadata grup
        const groupMetadata             = await getGroupMetadata(sock, remoteJid);
        const { participants, size }    = groupMetadata;
        const isAdmin                   = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

        // Cek apakah tidak ada member sider di grup
        if (listNotSider.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '📋 _Tidak ada member sider di grup ini._' },
                { quoted: message }
            );
        }

        // Daftar member sider yang ada di grup (semua member grup kecuali yang ada di listNotSider)
        const memberList = participants
            .filter(participant => !listNotSider.some(active => active.id === participant.id)) // Ambil member yang tidak ada di listNotSider
            .map(participant => `◧ @${participant.id.split('@')[0]}`) // Format output untuk member grup
            .join('\n');

        // Hitung jumlah member sider yang ada di grup
        const countSider = participants.filter(participant => !listNotSider.some(active => active.id === participant.id)).length;

// Teks pesan yang akan dikirim
const teks_sider = `_*${countSider} Dari ${participants.length}* Anggota Grup ${groupMetadata.subject} Adalah Sider_
        
_*Dengan Alasan :*_
➊ _Tidak Aktif Selama lebih dari ${TOTAL_HARI_SIDER} hari_
➋ _Join Tapi Tidak Pernah Nimbrung_

_Harap Aktif Di Grup Karena Akan Ada Pembersihan Member Setiap Saat_

_*List Member Sider*_
${memberList}`;

await sendMessageWithMention(sock, remoteJid, teks_sider, message);

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
    Commands    : ['gcsider'],
    OnlyPremium : false,
    OnlyOwner   : false
};
