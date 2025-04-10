const { setLeft } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;
    if (!isGroup) return; // Only Grub
    
    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validasi input kosong
    if (!content || !content.trim()) {
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} Selamat tinggal beban grub @name*_
        
_*List Variable*_

${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

        await setLeft(remoteJid, content);

        // Kirim pesan berhasil
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Left Berhasil di set_\n\n_Pastikan fitur sudah di aktifkan dengan mengetik *.on left*_`,
            },
            { quoted: message }
        );
}

module.exports = {
    handle,
    Commands    : ["setleft"],
    OnlyPremium : false,
    OnlyOwner   : false,
};
