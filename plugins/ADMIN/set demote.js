const { setDemote } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid,isGroup, message, content, sender, command, prefix } = messageInfo;
    if (!isGroup) return; // Only Grub

    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validasi input kosong
    if (!content || !content.trim()) {
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @name telah di turunkan dari admin*_
        
_*List Variable*_

${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }
        await setDemote(remoteJid, content.trim());

        // Kirim pesan berhasil
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Demote Berhasil di set_\n\n_Pastikan fitur sudah di aktifkan dengan mengetik *.on demote*_`,
            },
            { quoted: message }
        );
}

module.exports = {
    handle,
    Commands    : ["setdemote"],
    OnlyPremium : false,
    OnlyOwner   : false,
};
