const mess = require("@mess");
const { getGroupMetadata } = require("@lib/cache");
const { sendMessageWithMention, logTracking } = require("@lib/utils");
async function handle(sock, messageInfo) {
  const { remoteJid, message, isGroup, sender, senderType } = messageInfo;

  // Cek apakah permainan hanya untuk grup
  if (!isGroup) {
    const groupOnlyMessage = { text: mess.game.isGroup };
    return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
  }

  try {
    logTracking(`jadian.js - groupMetadata (${remoteJid})`);
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    if (!groupMetadata) {
      console.error("Failed to fetch group metadata");
      return;
    }

    const groupName = groupMetadata.subject;
    const participants = groupMetadata.participants;

    // Pilih pengirim secara acak, pastikan pengirim tidak dipilih
    let randomParticipant;
    do {
      randomParticipant =
        participants[Math.floor(Math.random() * participants.length)];
    } while (randomParticipant.id === sender);

    // Daftar kata-kata lucu atau kreatif yang akan muncul secara acak
    const randomMessages = [
      "Cocok banget, jodoh sejati! 😍💖 Jangan lupa kasih tau teman-teman kalian yang lagi cari jodoh!",
      "Hati-hati, jangan sampai kalian baper ya! 😜",
      "Wah, ini sih pasangan yang bikin iri banyak orang! 💕",
      "Saling cocok, jangan sampai lepas! 💘",
      "Kalian cocok banget, siap-siap jadi couple goals! 🔥",
      "Jangan lupa ngajak mereka jalan bareng ya! 🚶‍♂️🚶‍♀️",
      "Buat kalian yang jomblo, jangan khawatir! Mungkin jodoh masih nunggu! 😂",
    ];

    // Pilih pesan secara acak dari daftar
    const randomMessage =
      randomMessages[Math.floor(Math.random() * randomMessages.length)];

    const jadianMessage = `@${sender.split("@")[0]} ❤️ @${
      randomParticipant.id.split("@")[0]
    } \n\n${randomMessage}`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      jadianMessage,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error saat mengambil metadata grup:", error);
    const errorMessage = {
      text: "Terjadi kesalahan saat mengambil data grup.",
    };
    await sock.sendMessage(remoteJid, errorMessage, { quoted: message });
  }
}

module.exports = {
  handle,
  Commands: ["jadian"],
  OnlyPremium: false,
  OnlyOwner: false,
};
