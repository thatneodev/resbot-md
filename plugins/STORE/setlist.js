const { setList, deleteMessage  } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    // Periksa apakah pesan berasal dari grup
    if (!isGroup) return;

    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Periksa apakah pengirim adalah admin
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validasi input kosong
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Format Penggunaan:*

💬 *Contoh:* 
_${prefix}${command} LIST STORE_

_Berikut Daftar list_
⌬ @x

════════════
_Parameter yang bisa di pakai_

☍ @x${global.group.variable}
`;

        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }



    // Atur template list
    await setList(remoteJid, content);


    if(content.toLowerCase() == 'reset') {
        await deleteMessage(remoteJid, 'setlist');
        await sock.sendMessage(remoteJid, { text: '_✅ Berhasil reset Setlist_' }, { quoted: message });
        return;
    }
    // Kirim pesan sukses
    const successMessage = `✅ _Set List Berhasil Diatur_

_Ketik *.list* untuk melihat daftar list_ atau ketik .setlist reset untuk mengembalikan ke semula`;

    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["setlist"],
    OnlyPremium: false,
    OnlyOwner: false,
};
