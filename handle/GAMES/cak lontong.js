const { removeUser, getUser, isUserPlaying } = require("@tmpDB/cak lontong");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

async function process(sock, messageInfo) {
    const { remoteJid, content ,fullText, message, sender } = messageInfo;

    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // Ketika menyerah
        if(fullText.toLowerCase().includes('nyerah')){
            if (data && data.timer) {
                clearTimeout(data.timer);
            }
            removeUser(remoteJid);
            await sock.sendMessage(remoteJid, {
                text: `Yahh Menyerah\nJawaban: ${data.answer}\nDeskripsi : ${data.deskripsi}\n\nIngin bermain? Ketik *.cak lontong*`,
            }, { quoted: message });
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
                    money: hadiah
                });
            }

            removeUser(remoteJid);
            await sock.sendMessage(remoteJid, {
                text: `🎉 Selamat! Tebakan Anda benar. Anda mendapatkan ${hadiah} Money.`,
            }, { quoted: message });
        }
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name: "Cak Lontong",
    priority : 10,
    process,
};
