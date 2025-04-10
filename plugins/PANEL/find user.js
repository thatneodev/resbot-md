const config = require("@config");
const { createUser, findUserByEmail } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validasi input konten
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_Contoh: *${prefix + command} xxx@gmail.com*_`
            }, { quoted: message });
            return;
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(content)) {
            await sock.sendMessage(remoteJid, {
                text: "_Format email tidak valid. Contoh: xxx@gmail.com_"
            }, { quoted: message });
            return;
        }


        // Kirim reaksi untuk memberi tahu bahwa proses sedang berjalan
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Panggil fungsi createUser untuk membuat pengguna
        const result = await findUserByEmail(content);
        const { id, uuid, username, email, root_admin } = result.attributes;

        // Menentukan status admin
        const adminStatus = root_admin ? "✅ Admin" : "❌ Bukan Admin";
        
        // Kirim pesan sukses dengan detail informasi pengguna
        await sock.sendMessage(remoteJid, {
            text: `*Informasi Pengguna* 
        
🔹 *ID Pengguna*: ${id}
🔹 *UUID*: ${uuid}
🔹 *Username*: ${username}
🔹 *Email*: ${email}
🔹 *Status Admin*: ${adminStatus}`
        }, { quoted: message });

    } catch (error) {
        // Mengirimkan pesan error ke pengguna
        await sock.sendMessage(remoteJid, {
            text: error.message || 'Terjadi Kesalahan'
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['finduser'],
    OnlyPremium : false,
    OnlyOwner   : true,
};
