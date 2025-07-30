const { sendMessageWithMention } = require("@lib/utils");
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

    // Filter peserta dengan status admin
    const adminList = participants
      .filter((participant) => participant.admin !== null)
      .map((admin, index) => `◧ @${admin.id.split("@")[0]}`)
      .join("\n");

    // Cek jika tidak ada admin
    if (!adminList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _Tidak ada admin dalam grup ini._" },
        { quoted: message }
      );
    }

    // Teks notifikasi daftar admin
    const textNotif = `📋 *Daftar Admin Grup:*\n\n${adminList}`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listadmin:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Terjadi kesalahan saat menampilkan daftar admin." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listadmin"],
  OnlyPremium: false,
  OnlyOwner: false,
};
