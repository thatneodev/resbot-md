// PROMOTE: Menjadikan users ke admin

const mess = require("@mess");
const { sendMessageWithMention, determineUser } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    mentionedJid,
    content,
    isQuoted,
    prefix,
    command,
    senderType,
  } = messageInfo;
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

    // Menentukan pengguna
    const userToAction = determineUser(mentionedJid, isQuoted, content);
    if (!userToAction) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
            prefix + command
          } @NAME*_`,
        },
        { quoted: message }
      );
    }

    // Proses demote
    await sock.groupParticipantsUpdate(remoteJid, [userToAction], "promote");

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      `@${userToAction.split("@")[0]} Telah Menjadi admin grub`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in promote command:", error);

    // Kirim pesan kesalahan
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Terjadi kesalahan saat mencoba menaikkan menjadi admin." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["promote"],
  OnlyPremium: false,
  OnlyOwner: false,
};
