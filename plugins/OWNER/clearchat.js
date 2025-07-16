const { delay } = require("@lib/utils");

// Fungsi utama
const clearAllChats = async (sock) => {
    try {
        const chats = Object.keys(sock.chats); // Ambil semua JID chat

        for (const jid of chats) {
            // 1. Bersihkan isi pesan
            await sock.chatModify(
                {
                    clear: { type: 'all' }
                },
                jid
            );

            // Tunggu sedikit agar tidak ke-rate limit
            await delay(300); // delay 300ms

            // 2. Hapus daftar obrolan
            await sock.chatModify(
                {
                    delete: true
                },
                jid
            );

            console.log(`✅ Chat ${jid} dibersihkan & dihapus`);
        }
    } catch (err) {
        console.error('❌ Gagal membersihkan semua chat:', err);
    }
};

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    await sock.sendMessage(remoteJid, { text: '⏳ Sedang menghapus semua chat...' });
    await clearAllChats(sock);
    await sock.sendMessage(remoteJid, { text: '✅ Semua chat berhasil dihapus total!' });
}

module.exports = {
    handle,
    Commands: ['clearchat'],
    OnlyPremium: false,
    OnlyOwner: true
};
