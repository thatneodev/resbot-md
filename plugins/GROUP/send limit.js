const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    // Validasi input kosong
    if (!content || content.trim() === "") {
        return await sock.sendMessage(remoteJid,
            {
                text: `⚠️ _Masukkan format yang valid_\n\n_Contoh: *${prefix + command} 6285246154386 50*_\n\n_Atau tag orangnya_ \n*${prefix + command} @tag 50*`,
            },
            { quoted: message }
        );
    }

    try {
        // Pisahkan konten
        const args = content.trim().split(/\s+/);
        if (args.length < 2) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Format tidak valid. Contoh:_ *${prefix + command} 6285246154386 50*`,
                },
                { quoted: message }
            );
        }

        const target = args[0]; // Nomor penerima atau tag
        const limitToSend = parseInt(args[1], 10);

        // Validasi jumlah limit
        if (isNaN(limitToSend) || limitToSend <= 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Jumlah limit harus berupa angka positif_\n\n_Contoh: *${prefix + command} 628xxxxx 50*_` },
                { quoted: message }
            );
        }

        // Ambil nomor penerima (handle tag atau nomor biasa)
        const targetNumber = target.startsWith("@") ? target.replace("@", "").trim() : target;
        const targetId = targetNumber.includes("@s.whatsapp.net") ? targetNumber : `${targetNumber}@s.whatsapp.net`;

        // Validasi: Tidak bisa mengirim ke diri sendiri
        if (targetId === sender) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Anda tidak bisa mengirim limit ke nomor Anda sendiri._` },
                { quoted: message }
            );
        }

        // Ambil data pengguna pengirim
        const senderData = await findUser(sender);

        // Validasi apakah pengirim memiliki cukup limit
        if (senderData.limit < limitToSend) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Limit Anda tidak cukup untuk mengirim ${limitToSend} limit._` },
                { quoted: message }
            );
        }

        // Ambil data penerima
        const receiverData = await findUser(targetId);

        if (!receiverData) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Pengguna dengan nomor/tag tersebut tidak ditemukan._` },
                { quoted: message }
            );
        }

        // Update limit pengguna pengirim dan penerima
        await updateUser(sender, { limit: senderData.limit - limitToSend });
        await updateUser(targetId, { limit: receiverData.limit + limitToSend });

        // Kirim pesan berhasil
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Berhasil mengirim ${limitToSend} limit ke ${targetNumber}._\n\nKetik *.me* untuk melihat detail akun Anda.`,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Terjadi kesalahan:", error);

        // Kirim pesan error
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.`,
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["sendlimit"],
    OnlyPremium : false,
    OnlyOwner   : false
};
