const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");
const path = require("path");
const mess = require("@mess");

const mainDir = path.dirname(require.main.filename);

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, type, isQuoted, prefix, command, sender } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
 
        // Unduh media (gambar) dan tentukan tipe media
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaType = isQuoted
            ? `${isQuoted.type}Message`
            : `${type}Message`;

        if (media && mediaType === "imageMessage") {
            const groupId = groupMetadata.id;
            const mediaPath = path.join(mainDir, "./tmp/", media);

            // Update foto profil bot
            await sock.updateProfilePicture(groupId, { url: mediaPath });

            // Kirim pesan konfirmasi
            return await sock.sendMessage(
                remoteJid,
                { text: `_Berhasil, Foto Profil Grub Telah Di Ganti_` },
                { quoted: message }
            );
        }

        // Jika media tidak valid, kirim instruksi
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Kirim/Balas gambar dengan caption *${prefix + command}*_` },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing message:", error);

        // Kirim pesan error
        await sock.sendMessage(remoteJid, {
            text: "Terjadi kesalahan saat Mengganti Foto Profil Grub. Pastikan bot adalah admin",
        });
    }
}

module.exports = {
    handle,
    Commands    : ["setppgc","setppgroub","setppgrub","setppgroup","setppgrup"],
    OnlyPremium : false,
    OnlyOwner   : false
};
