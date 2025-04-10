const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;

    // Validasi input kosong
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 50*_\n\n_Ket : *1* limit = *20* money_` },
            { quoted: message }
        );
    }

    // Pastikan `content` hanya angka
    const limitToBuy = parseInt(content.trim(), 10);
    if (isNaN(limitToBuy) || limitToBuy <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Jumlah limit harus berupa angka positif_\n\n_Contoh: *buylimit 50*_` },
            { quoted: message }
        );
    }

    // Harga per limit
    const pricePerLimit = 20;
    const totalCost = limitToBuy * pricePerLimit;

    // Ambil data user
    const dataUsers = await findUser(sender);

    // Validasi apakah user memiliki cukup saldo
    if (dataUsers.money < totalCost) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Saldo Anda tidak cukup untuk membeli *${limitToBuy}* limit._\n\n_Harga total:_ ${totalCost} money\n_Saldo Anda:_ ${dataUsers.money} money` },
            { quoted: message }
        );
    }

    // Update data pengguna
    await updateUser(sender, {
        limit: dataUsers.limit + limitToBuy, // Tambah limit
        money: dataUsers.money - totalCost, // Kurangi saldo
    });

    // Kirim pesan berhasil
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Pembelian limit berhasil! 🎉_\n\n_Limit Anda bertambah: *${limitToBuy}*_\n_Saldo Anda:_ ${dataUsers.money - totalCost} money` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['buylimit'],
    OnlyPremium : false,
    OnlyOwner   : false
};
