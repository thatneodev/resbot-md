const { findUser, updateUser } = require("@lib/users");
const { formatDuration }        = require("@lib/utils"); // Fungsi untuk menghitung durasi waktu
const { logCustom }             = require("@lib/logger");
const mess                      = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, message, sender, pushName, mentionedJid } = messageInfo;

    try {
        // Fungsi untuk membangun pesan AFK
        const buildAfkMessage = (name, afkData) => {
            const durasiAfk = formatDuration(afkData.lastChat);
            const alasanTeks = afkData.alasan ? `\n\n📌 ${afkData.alasan}` : "\n\n📌 Tanpa Alasan";

            if (mess.handler.afk) {
                let warningMessage = mess.handler.afk
                    .replace('@sender', name)
                    .replace('@durasi', durasiAfk)
                    .replace('@alasan', alasanTeks);
                return warningMessage;
            }
            return null;
        };

        // Cek status AFK pengguna saat ini
        let userAfk = await findUser(sender);
    
  
        if (userAfk?.status === "afk" && userAfk.afk) {
            if(mess.handler.afk_message) {
                const afkMessage = mess.handler.afk_message
                .replace('@sender', pushName)
                .replace('@durasi', formatDuration(userAfk.afk.lastChat))
                .replace('@alasan', userAfk.afk.alasan ? `\n\n📌 ${userAfk.afk.alasan}` : "\n\n📌 Tanpa Alasan");
                
                if(afkMessage) {
                    await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message });
                }
            }
            
            await updateUser(sender, { status: "aktif", afk: null });
            return false;
        }

            if (mentionedJid?.length > 0) {
                const mentionedUsers = await Promise.all(
                    mentionedJid.map(async (jid) => {
                        return await findUser(jid); // Ambil data pengguna berdasarkan JID
                    })
                );
            for (const mentionedUser of mentionedUsers) {
                    if (mentionedUser?.status === "afk" && mentionedUser.afk) {
                        const afkMessage = buildAfkMessage(mentionedUser.name || "Pengguna", mentionedUser.afk);
                        if(afkMessage) {
                            await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message });
                        }
                        break; // Keluar dari loop setelah mengirim pesan pertama
                    }
                }
            }


            
    } catch (error) {
        console.error("Error in AFK process:", error);
        logCustom('info', error, `ERROR-AFK-HANDLE.txt`);
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name        : "Afk",
    priority    : 3,
    process,
};
