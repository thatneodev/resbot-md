const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak bendera");
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
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

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

            removeUser(remoteJid);
            if(mess.game_handler.tebak_bendera) {
                const messageNotif = mess.game_handler.tebak_bendera
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
    name: "Tebak Bendera",
    priority : 10,
    process,
};
