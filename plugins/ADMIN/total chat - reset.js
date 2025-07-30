const mess = require("@mess");
const { resetTotalChatPerGroup } = require("@lib/totalchat");
const { sendMessageWithMention } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

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

    await resetTotalChatPerGroup(remoteJid);

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      "_Total Chat di grub ini berhasil direset_",
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling reset total chat command:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "Terjadi kesalahan saat memproses permintaan Anda." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["resettotalchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};
