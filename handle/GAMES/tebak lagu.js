const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak lagu");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");
const mess = require("@mess");

async function process(sock, messageInfo) {
  const { remoteJid, content, fullText, message, sender } = messageInfo;

  if (isUserPlaying(remoteJid)) {
    const data = getUser(remoteJid);

    // Ketika menyerah
    if (fullText.toLowerCase().includes("nyerah")) {
      removeUser(remoteJid);

      if (data && data.timer) {
        clearTimeout(data.timer);
      }

      if (mess.game_handler.menyerah) {
        const messageWarning = mess.game_handler.menyerah
          .replace("@answer", data.answer)
          .replace("@command", data.command);

        await sock.sendMessage(
          remoteJid,
          {
            text: messageWarning,
          },
          { quoted: message }
        );
      }

      return false;
    }

    if (fullText.toLowerCase() === data.answer) {
      const hadiah = data.hadiah;

      if (data && data.timer) {
        clearTimeout(data.timer);
      }

      // Mencari pengguna
      const user = await findUser(sender);

      if (user) {
        const [docId, userData] = user;
        const moneyAdd = (userData.money || 0) + hadiah; // Default money ke 0 jika undefined
        await updateUser(sender, { money: moneyAdd });
      } else {
      }

      removeUser(remoteJid);
      if (mess.game_handler.tebak_lagu) {
        const messageNotif = mess.game_handler.tebak_lagu.replace(
          "@hadiah",
          hadiah
        );
        await sock.sendMessage(
          remoteJid,
          {
            text: messageNotif,
          },
          { quoted: message }
        );
      }

      return false;
    }
  }

  return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
  name: "Tebak Lagu",
  priority: 10,
  process,
};
