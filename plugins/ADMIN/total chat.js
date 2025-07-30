const mess = require("@mess");
const { getTotalChatPerGroup } = require("@lib/totalchat");
const { sendMessageWithMention } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup, senderType } = messageInfo;
  if (!isGroup) return; // Hanya untuk grup

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

    // Ambil total chat per grup
    const totalChatData = await getTotalChatPerGroup(remoteJid);

    // Gabungkan data peserta dengan jumlah chat mereka
    const chatWithParticipants = participants.map((participant) => ({
      id: participant.id,
      totalChat: totalChatData[participant.id] || 0,
    }));

    if (chatWithParticipants.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_Belum ada data chat untuk grup ini._" },
        { quoted: message }
      );
    }

    // Hitung total semua chat di grup
    const totalChatCount = chatWithParticipants.reduce(
      (sum, p) => sum + p.totalChat,
      0
    );

    // Urutkan anggota berdasarkan jumlah chat
    const sortedMembers = chatWithParticipants.sort(
      (a, b) => b.totalChat - a.totalChat
    );

    // Format pesan untuk dikirim
    let response = `══✪〘 *👥 Total Chat* 〙✪══:\n\n`;
    sortedMembers.forEach(({ id, totalChat }, index) => {
      response += `◧  @${id.split("@")[0]}: ${totalChat} chat\n`;
    });

    response += `\n\n📊 _Total chat di grup ini:_ *${totalChatCount}*`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      response,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling total chat command:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "Terjadi kesalahan saat memproses permintaan Anda." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["totalchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};
