const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, pushName } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {
        // Ambil data user dari database
        const dataUsers = await findUser(sender);

        if (dataUsers) {
            const alasan = content 
            ? `Alasan : ${content.length > 100 ? content.slice(0, 100) + "..." : content}` 
            : "Tanpa Alasan";
        
            const waktuSekarang = new Date();

            // Perbarui status pengguna menjadi AFK
            await updateUser(sender, {
                status: "afk",
                afk: {
                    lastChat: waktuSekarang.toISOString(),
                    alasan,
                },
            });

            // Kirim pesan ke grup atau chat pribadi
            await sock.sendMessage(
                remoteJid,
                { text: `😓 Yahh, Kak ${pushName} Telah AFK.\n\n📌 ${alasan}` },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error in AFK command:", error);

        // Kirim pesan error jika terjadi masalah
        await sock.sendMessage(
            remoteJid,
            { text: "❌ Terjadi kesalahan saat memproses perintah. Silakan coba lagi nanti." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["afk"],
    OnlyPremium : false,
    OnlyOwner   : false
};
