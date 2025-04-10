const { reply } = require("@lib/utils");
const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, mentionedJid } = messageInfo;

    try {
        // Validasi input kosong
        if (!content || !content.trim()) {
            return await reply(
                m,
                `⚠️ _Masukkan format yang valid_\n\n_Contoh: *${prefix + command} 628xxx*_`
            );
        }

        // Tentukan nomor target
        let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, '');
        const originalNumber = targetNumber;

        // Validasi format nomor (10-15 digit)
        if (!/^\d{10,15}$/.test(targetNumber)) {
            return await reply(
                m,
                `⚠️ _Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${prefix + command} 628xxx*_`
            );
        }

        // Tambahkan @s.whatsapp.net jika belum ada
        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }

        // Ambil data user dari database
        const dataUser = await findUser(targetNumber);

        if (!dataUser) {
            return await reply(
                m,
                `⚠️ _Nomor ${originalNumber} tidak ditemukan di database._\n\n` +
                `_Pastikan nomor yang dimasukkan benar dan terdaftar dalam database._`
            );
            
        }

        // Perbarui status pengguna menjadi "block"
        await updateUser(targetNumber, { status: "active" });
        await sock.updateBlockStatus(targetNumber, "unblock");
        return await reply(
            m,
            `✅ _Nomor ${originalNumber} berhasil dibuka dari pemblokiran!_`
        );

    } catch (error) {
        console.error("Error handling command:", error);
        return await reply(
            m,
            `_Terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti._`
        );
    }
}

module.exports = {
    handle,
    Commands    : ['unblock'],
    OnlyPremium : false,
    OnlyOwner   : true,
};
