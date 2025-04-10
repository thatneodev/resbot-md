const { setWelcome } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;
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
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} Selamat datang @name*_
        
_*List Variable*_

${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

        await setWelcome(remoteJid, content);

        // Kirim pesan berhasil
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Welcome Berhasil di set_\n\n_Pastikan fitur sudah di aktifkan dengan mengetik *.on welcome*_`,
            },
            { quoted: message }
        );
}

module.exports = {
    handle,
    Commands    : ["setwelcome"],
    OnlyPremium : false,
    OnlyOwner   : false,
};
