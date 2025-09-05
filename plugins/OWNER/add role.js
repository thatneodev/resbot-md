const { reply } = require("@lib/utils");
const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content } = messageInfo;

    // 1. Memisahkan argumen: nama role dan target pengguna
    const args = content.trim().split(" ");
    if (args.length < 2) {
        return await reply(
            m,
            `*Format Salah!* ❌\n\n_Gunakan format ini untuk mengatur role:_\n*${prefix + command} <nama_role> @tag_user*\n*${prefix + command} <nama_role> 628...*`
        );
    }

    const roleName = args.shift().toLowerCase(); // Ambil kata pertama sebagai nama role
    const targetIdentifier = args.join(" ");   // Sisa argumen adalah target

    // 2. Validasi nama role (opsional, tapi bagus untuk keamanan)
    // Regex ini hanya mengizinkan huruf, angka, dan underscore
    if (!/^[a-z0-9_]+$/.test(roleName)) {
        return await reply(m, "_Nama role hanya boleh berisi huruf kecil, angka, dan underscore (_)._");
    }

    // 3. Menentukan target JID (dari mention atau nomor)
    let targetJid;
    if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0];
    } else {
        const number = targetIdentifier.replace(/\D/g, "");
        if (!number) {
            return await reply(m, `_Target tidak valid. Silakan tag pengguna atau masukkan nomor WhatsApp._`);
        }
        targetJid = `${number}@s.whatsapp.net`;
    }

    // 4. Mencari pengguna di database
    const userData = findUser(targetJid);
    if (!userData) {
        return await reply(m, `_Pengguna @${targetJid.split('@')[0]} tidak ditemukan di database. Pastikan dia pernah berinteraksi dengan bot._`, {
             mentions: [targetJid]
        });
    }
    
    // 5. Memperbarui role pengguna menggunakan fungsi updateUser
    try {
        const success = updateUser(targetJid, { role: roleName });

        if (success) {
            await reply(
                m,
                `✅ *Sukses!* Role untuk @${targetJid.split('@')[0]} telah diubah menjadi *${roleName}*.`,
                { mentions: [targetJid] }
            );
        } else {
            throw new Error("Fungsi updateUser mengembalikan false.");
        }
    } catch (error) {
        console.error("Error saat update role:", error);
        await reply(m, "_Terjadi kesalahan saat mencoba memperbarui role pengguna._");
    }
}

module.exports = {
    handle,
    Commands: ['setrole', 'addrole'], // Bisa dipanggil dengan .setrole atau .addrole
    OnlyPremium: false,
    OnlyOwner: true // Perintah ini hanya untuk Owner
};
