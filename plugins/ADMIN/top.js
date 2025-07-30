const { sendMessageWithMention } = require("@lib/utils");
const { readUsers } = require("@lib/users");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only Grub

  try {
    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(
      (participant) => participant.id === sender && participant.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Baca data user dari database atau file
    const dataUsers = await readUsers();

    // Urutkan pengguna berdasarkan money (terbesar ke terkecil) dan ambil 10 teratas
    const topUsers = Object.entries(dataUsers)
      .sort(([, a], [, b]) => b.money - a.money) // Urutkan berdasarkan money
      .slice(0, 10); // Ambil 10 pengguna teratas

    // Format daftar pengguna
    const memberList = topUsers
      .map(
        ([id, userData], index) =>
          `┣ ⌬ @${id.split("@")[0]} - 💰 Money: ${userData.money}`
      )
      .join("\n");

    const textNotif = `┏━『 *TOP 10 MEMBER* 』\n┣\n${memberList}\n┗━━━━━━━━━━━━━━━`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in handle:", error);
    // Tangani error dan kirim pesan
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Terjadi kesalahan saat menampilkan daftar pengguna." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["top"],
  OnlyPremium: false,
  OnlyOwner: false,
};
