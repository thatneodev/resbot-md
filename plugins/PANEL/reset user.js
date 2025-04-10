const { listUser, deleteUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input konten
        if (!content || content.toLowerCase() !== '-y') {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ _Perintah ini akan menghapus seluruh data server._ \n\n_Silakan ketik *.${command} -y* untuk melanjutkan._`
            }, { quoted: message });
            return;
        }

        // Kirim reaksi untuk memberi tahu bahwa proses sedang berjalan
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Mengambil daftar server
        const result = await listUser();
        let serverDeleted = 0;

        // Jika tidak ada server yang ditemukan
        if (!result.data || result.data.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: "❌ Tidak ada User yang ditemukan untuk direset."
            }, { quoted: message });
            return;
        }

        // Hapus semua server
        for (const server of result.data) {
            const { id, root_admin } = server.attributes;

            if(!root_admin) {
                try {
                    await deleteUser(id);
                    serverDeleted++;
                } catch (err) {
                    console.error(`Gagal menghapus user dengan ID ${id}:`, err.message);
                }
            }
        }

        // Kirim pesan selesai
        const msgResponse = `✅ _Data Pengguna berhasil direset._\n\n${serverDeleted} pengguna berhasil dihapus.`;
        await sock.sendMessage(remoteJid, {
            text: msgResponse
        }, { quoted: message });

    } catch (error) {
        // Menangani error secara global dan mengirimkan pesan error
        console.error("Terjadi kesalahan saat mereset user:", error);
        await sock.sendMessage(remoteJid, {
            text: `❌ Terjadi kesalahan: ${error.message || 'Tidak diketahui'}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['resetuser'],
    OnlyPremium : false,
    OnlyOwner   : true,
};
