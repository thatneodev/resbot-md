const { readUsers } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Ambil hanya pengguna yang memiliki atribut premium dan tanggalnya masih berlaku
    const premiumUsers = Object.entries(users)
      .filter(
        ([, value]) => value.premium && new Date(value.premium) > new Date()
      )
      .map(([key, value]) => ({ jid: key, ...value }));

    if (premiumUsers.length === 0) {
      // Jika tidak ada pengguna premium
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ Tidak ada pengguna yang premium saat ini." },
        { quoted: message }
      );
    }

    // Format daftar pengguna premium
    const premiumList = premiumUsers
      .map(
        (user, index) =>
          `◧ @${user.jid.split("@")[0]} (Premium hingga: ${new Date(
            user.premium
          ).toLocaleDateString()})`
      )
      .join("\n");

    const textNotif = `📋 *LIST PREMIUM:*\n\n${premiumList}\n\n_Total:_ *${premiumUsers.length}*`;

    // Kirim pesan dengan mention ke pengguna premium
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
  Commands: ["listprem", "listpremium"],
  OnlyPremium: false,
  OnlyOwner: true,
};
