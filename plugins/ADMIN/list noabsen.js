const { findAbsen } = require("@lib/absen");
const { sendMessageWithMention } = require("@lib/utils");
const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    if (!isGroup) return; // Hanya bisa digunakan di grup

    try {
        // Ambil metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const totalMembers = participants.length;

        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Ambil data absen
        const data = await findAbsen(remoteJid);
        const absenMembers = data?.member || [];

        // Dapatkan daftar yang belum absen
        const noAbsenMembers = participants
            .filter(p => !absenMembers.includes(p.id))
            .map((p, index) => `${index + 1}. @${p.id.split('@')[0]}`);

        let textNotif;
        if (noAbsenMembers.length > 0) {
            textNotif = `📋 *Daftar Yang Belum Absen:*\n\n${noAbsenMembers.join('\n')}\n\n` +
                        `⏳ *${noAbsenMembers.length} orang belum absen hari ini.*`;
        } else {
            textNotif = '✅ Semua anggota sudah absen hari ini.';
        }

        await sendMessageWithMention(sock, remoteJid, textNotif, message);

    } catch (error) {
        console.error('Error handling listnoabsen:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat menampilkan daftar yang belum absen.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['listnoabsen'],
    OnlyPremium: false,
    OnlyOwner: false
};
