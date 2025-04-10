const { reply } = require("@lib/utils");
const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, mentionedJid } = messageInfo;

    try {
        // Validasi input kosong
        if (!content || !content.trim()) {
            return await reply(
                m,
                `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 628xxx*_
                
_Fitur *block* akan membuat user tidak dapat menggunakan bot di semua grub dan chat pribadi_

_gunakan fitur *ban* untuk memblokir user di grub ini saja_`
            );
        }

        // Tentukan nomor target
        let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, '');
        const originalNumber = targetNumber;

        // Validasi format nomor (10-15 digit)
        if (!/^\d{10,15}$/.test(targetNumber)) {
            return await reply(
                m,
                `_Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${prefix + command} 628xxx*_`
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
                `_⚠️ Nomor ${originalNumber} tidak ditemukan di database._\n\n` +
                `_Pastikan nomor yang dimasukkan benar dan terdaftar dalam database._`
            );
            
        }

        // Perbarui status pengguna menjadi "block"
        await updateUser(targetNumber, { status: "block" });
        await sock.updateBlockStatus(targetNumber, "block");
        return await reply(
            m,
            `_✅ Nomor ${originalNumber} berhasil diblokir!_\n\n` +
            `_⚠️ Info: Nomor yang telah diblokir tidak dapat menggunakan semua fitur bot hingga proses pembukaan blokir dilakukan melalui perintah *${prefix}unblock*._`
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
    Commands    : ['block'],
    OnlyPremium : false,
    OnlyOwner   : true
};
