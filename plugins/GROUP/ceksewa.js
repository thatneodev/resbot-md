const { findSewa }          = require("@lib/sewa");
const { selisihHari }       = require("@lib/utils");
const { getGroupMetadata }  = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;
    if (!isGroup) return; // Only Grub

    // Mendapatkan metadata grup
    const { subject } = await getGroupMetadata(sock, remoteJid);

    // Memeriksa data sewa
    const dataSewa = await findSewa(remoteJid);

    if (!dataSewa) {
        // Jika grup tidak termasuk sewa bot
        await sock.sendMessage(
            remoteJid,
            { text: '_Grup Tidak Termasuk Sewa Bot_' },
            { quoted: message }
        );
        return;
    }

    // Mengecek masa sewa
    const selisihHariSewa = selisihHari(dataSewa.expired);

    // Mengirimkan informasi masa sewa
    await sock.sendMessage(
        remoteJid,
        { 
            text: `_*Name Group:*_ ${subject}

_*Masa Sewabot:*_ _*${selisihHariSewa}*_`
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['ceksewa'],
    OnlyPremium : false,
    OnlyOwner   : false
};