const { readUsers } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Ambil hanya pengguna yang statusnya 'blacklist'
    const blockedUsers = Object.entries(users)
      .filter(([key, value]) => value.status === "blacklist")
      .map(([key, value]) => ({ jid: key, ...value }));

    if (blockedUsers.length === 0) {
      // Jika tidak ada pengguna yang diblokir
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ Tidak ada pengguna yang di blacklist saat ini." },
        { quoted: message }
      );
    }

    // Format daftar pengguna yang diblokir
    const blockedList = blockedUsers
      .map((user, index) => `◧ @${user.jid.split("@")[0]}`)
      .join("\n");

    const textNotif = `📋 *BLACKLIST:*\n\n${blockedList}\n\n_Total:_ *${blockedUsers.length}*`;

    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "Terjadi kesalahan saat memproses data pengguna." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listblacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};
