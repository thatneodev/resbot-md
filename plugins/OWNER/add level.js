const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command, mentionedJid, isQuoted } = messageInfo;

    // Validasi input kosong
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 628xxx 10*_` },
            { quoted: message }
        );
    }


    // Pisahkan nomor dan jumlah level
    const [rawNumber, rawLevel] = content.split(' ').map(item => item.trim());

    // Menentukan pengguna
    const userToAction = determineUser(mentionedJid, isQuoted, rawNumber);
    if (!userToAction) {
        return await sock.sendMessage(
            remoteJid,
            { text:  `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 628xxx 50*_` },
            { quoted: message }
        );
    }

    if (!userToAction || !rawLevel) {
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
            { text: `⚠️ _Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${prefix + command} 628xxx 5*_` },
            { quoted: message }
        );
    }

    // Validasi level
    const levelToAdd = parseInt(rawLevel, 10);
    if (isNaN(levelToAdd) || levelToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Jumlah level harus berupa angka positif_\n\n_Contoh: *${prefix + command} 628xxx 5*_` },
            { quoted: message }
        );
    }

    // Ambil data pengguna
    const dataUsers = await findUser(senderAdd);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Pengguna dengan nomor ${rawNumber} tidak ditemukan._` },
            { quoted: message }
        );
    }

    // Update data pengguna
    await updateUser(senderAdd, {
        level: (dataUsers.level || 0) + levelToAdd, // Tambah level
    });

    // Kirim pesan berhasil
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Level berhasil ditambah ${levelToAdd} untuk nomor ${rawNumber}._` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addlevel'],
    OnlyPremium : false,
    OnlyOwner   : true
};
