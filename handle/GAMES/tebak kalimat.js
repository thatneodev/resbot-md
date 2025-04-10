const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak kalimat");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");
const mess                      = require('@mess');

async function process(sock, messageInfo) {
    const { remoteJid, content ,fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // Ketika menyerah
        if(fullText.toLowerCase().includes('nyerah')){
            removeUser(remoteJid);
            if (data && data.timer) {
                clearTimeout(data.timer);
            }
            if(mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                .replace('@answer', data.answer)
                .replace('@command', data.command);

                await sock.sendMessage(remoteJid, {
                    text: messageWarning,
                }, { quoted: message });
            }
            return false;
        }



        if (fullText.toLowerCase() === data.answer) {
            const hadiah = data.hadiah;

            // Mencari pengguna
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah; // Default money ke 0 jika undefined
                await updateUser(sender, { money: moneyAdd });
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            if (data && data.timer) {
                clearTimeout(data.timer);
            }
            removeUser(remoteJid);
            if(mess.game_handler.tebak_kalimat) {
                const messageNotif = mess.game_handler.tebak_kalimat
                .replace('@hadiah', hadiah);
                await sock.sendMessage(remoteJid, {
                    text: messageNotif,
                }, { quoted: message });
            }

            return false;
        }
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name: "Tebak Kalimat",
    priority : 10,
    process,
};
