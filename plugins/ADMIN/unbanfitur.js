const mess = require("@mess");
const { removeFiturFromBlock } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention, determineUser } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    content,
    prefix,
    command,
    senderType,
  } = messageInfo;

  if (!isGroup) return; // Only Grub

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

  if (!content) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } pin*_`,
      },
      { quoted: message }
    );
  }

  try {
    const result = await removeFiturFromBlock(remoteJid, content);
    if (result) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `✅ _Fitur ${content} berhasil di aktifkan untuk grub ini_`,
        message,
        senderType
      );
    } else {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `⚠️ _*${content}* tidak di temukan di banfitur_`,
        message,
        senderType
      );
    }
  } catch (error) {
    console.log(error);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _Ada masalah_`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["unbanfitur"],
  OnlyPremium: false,
  OnlyOwner: false,
};
