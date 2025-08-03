const { findUser, updateUser, addUser } = require("@lib/users");
const { sendMessageWithMention, determineUser } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

let inProccess = false;

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    if (inProccess) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `_Proses sedang berlangsung silakan tunggu hingga selesai_`,
        message,
        senderType
      );
      return;
    }

    // Validasi input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ \n_*${
        prefix + command
      }*_ https://chat.whatsapp.com/xxx 30`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let [linkgrub, jumlahHariPremium] = content.split(" ");

    if (!linkgrub.includes("chat.whatsapp.com") || isNaN(jumlahHariPremium)) {
      const tex = `⚠️ _Pastikan format yang benar : ${
        prefix + command
      } https://chat.whatsapp.com/xxx 30_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    inProccess = true;
    jumlahHariPremium = parseInt(jumlahHariPremium);

    const idFromGc = linkgrub.split("https://chat.whatsapp.com/")[1];

    const res = await sock.query({
      tag: "iq",
      attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
      content: [{ tag: "invite", attrs: { code: idFromGc } }],
    });

    if (!res.content[0]?.attrs?.id) {
      const tex = `⚠️ _Link Grup tidak valid atau Pastikan Bot Sudah bergabung_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    const groupId = res.content[0].attrs.id + "@g.us";

    // Mendapatkan metadata grup
    const groupMetadata = await getGroupMetadata(sock, groupId);
    const participants = groupMetadata.participants;

    let successCount = 0;
    let failedCount = 0;
    let totalsize = participants.length;

    for (const [index, member] of participants.entries()) {
      //await new Promise((resolve) => setTimeout(resolve, index * 500));
      try {
        const id_users = member.id;

        // Ambil data pengguna
        let dataUsers = await findUser(id_users);

        // Hitung waktu premium baru dari hari ini
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + jumlahHariPremium);

        // Jika pengguna tidak ditemukan, tambahkan pengguna baru
        if (!dataUsers) {
          return await sock.sendMessage(
            remoteJid,
            {
              text: `⚠️ _Pengguna dengan nomor/tag tersebut tidak ditemukan._`,
            },
            { quoted: message }
          );
        }

        const [docId, userData] = dataUsers;

        userData.premium = currentDate.toISOString();
        await updateUser(id_users, userData);

        successCount++;
      } catch (error) {
        console.error(`Gagal menambahkan premium untuk ${member.id}:`, error);
        failedCount++;
      }
    }

    inProccess = false;

    const responseText = `✅ Berhasil menambahkan ${successCount} pengguna ke member premium.\n❌ Gagal: ${failedCount}`;
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);
    inProccess = false;
    await sock.sendMessage(
      remoteJid,
      { text: "❌ Terjadi kesalahan saat memproses data." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["addpremgrub", "addpremiumgrub"],
  OnlyPremium: false,
  OnlyOwner: true, // Hanya owner yang bisa akses
};
