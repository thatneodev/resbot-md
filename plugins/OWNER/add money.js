const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    // Pisahkan nomor dan jumlah money
    const [rawNumber, rawMoney] = content.split(' ').map(item => item.trim());

    const userToAction = determineUser(mentionedJid, isQuoted, rawNumber);

    if (!userToAction || !rawMoney) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_Masukkan format yang benar_\n\n_Contoh: *${prefix + command} 628xxx 50*_` },
            { quoted: message }
        );
    }

    // Validasi nomor pengguna dan tambahkan "@s.whatsapp.net"
    const senderAdd = userToAction.replace(/[^0-9]/g, '') + "@s.whatsapp.net"; // Tambahkan domain
    if (!/^\d{10,15}@s\.whatsapp\.net$/.test(senderAdd)) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${prefix + command} 628xxx 50*_` },
            { quoted: message }
        );
    }

    // Validasi money
    const moneyToAdd = parseInt(rawMoney, 10);
    if (isNaN(moneyToAdd) || moneyToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_Jumlah money harus berupa angka positif_\n\n_Contoh: *${prefix + command} 628xxx 50*_` },
            { quoted: message }
        );
    }

    // Ambil data pengguna
    const dataUsers = await findUser(senderAdd);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: `Pengguna dengan nomor ${rawNumber} tidak ditemukan.` },
            { quoted: message }
        );
    }

    // Update data pengguna
    await updateUser(senderAdd, {
        money: (dataUsers.money || 0) + moneyToAdd, // Tambah money
    });

    // Kirim pesan berhasil
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Money berhasil ditambah sebesar ${moneyToAdd} untuk nomor ${rawNumber}._` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addmoney'],
    OnlyPremium : false,
    OnlyOwner   : true
};
