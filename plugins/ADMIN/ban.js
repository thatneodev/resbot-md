const mess = require("@mess");
const { addUserBlock } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention, determineUser } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    isQuoted,
    content,
    prefix,
    command,
    mentionedJid,
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

  // Menentukan pengguna yang akan dikeluarkan
  const userToBan = determineUser(mentionedJid, isQuoted, content);
  if (!userToBan) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } 6285246154386*_`,
      },
      { quoted: message }
    );
  }

  const whatsappJid = userToBan;

  try {
    await addUserBlock(remoteJid, whatsappJid);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `✅ @${whatsappJid.split("@")[0]} _Berhasil di ban untuk grub ini_`,
      message,
      senderType
    );
  } catch (error) {
    console.log(error);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _Tidak dapat ban nomor_ @${whatsappJid.split("@")[0]}`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["ban"],
  OnlyPremium: false,
  OnlyOwner: false,
};
