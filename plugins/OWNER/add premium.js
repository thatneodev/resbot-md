const { findUser, updateUser, addUser } = require("@lib/users");
const { sendMessageWithMention, determineUser } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    mentionedJid,
    isQuoted,
    content,
    prefix,
    command,
    senderType,
  } = messageInfo;

  try {
    // Validasi input
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
        prefix + command
      } 6285246154386 30*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let [nomorHp, jumlahHariPremium] = content.split(" ");

    const userToAction = determineUser(mentionedJid, isQuoted, nomorHp);

    // Hapus semua karakter selain angka dari nomorHp
    nomorHp = userToAction.replace(/\D/g, "");

    // Validasi input lebih lanjut
    if (!nomorHp || !jumlahHariPremium || isNaN(jumlahHariPremium)) {
      const tex = "⚠️ _Pastikan format yang benar : .addprem 6285246154386 30_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // Validasi format nomor (10-15 digit)
    if (!/^\d{10,15}$/.test(nomorHp)) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_Nomor tidak valid. Pastikan formatnya benar_\n\n_Contoh: *${
            prefix + command
          } 628xxx* 30_`,
        },
        { quoted: message }
      );
    }

    // Tambahkan @s.whatsapp.net ke nomor HP
    nomorHp = `${nomorHp}@s.whatsapp.net`;

    // Ambil data pengguna
    let userData = await findUser(nomorHp);

    // Jika pengguna tidak ditemukan, tambahkan pengguna baru
    if (!userData) {
      userData = {
        money: 0,
        role: "user",
        status: "active",
        premium: null, // Tidak ada masa premium sebelumnya
      };
      await addUser(nomorHp, userData); // Tambahkan pengguna baru
    }

    // Hitung waktu premium baru dari hari ini
    const currentDate = new Date();
    const addedPremiumTime = currentDate.setDate(
      currentDate.getDate() + parseInt(jumlahHariPremium)
    ); // Menambahkan hari

    // Update data premium pengguna
    userData.premium = new Date(addedPremiumTime).toISOString(); // Simpan dalam format ISO 8601

    // Update data pengguna di database
    await updateUser(nomorHp, userData);

    // Tampilkan pesan bahwa premium sudah ditambahkan
    const premiumEndDate = new Date(addedPremiumTime);
    const responseText = `_Masa Premium pengguna_ @${
      nomorHp.split("@")[0]
    } _telah diperpanjang hingga:_ ${premiumEndDate.toLocaleString()}`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);

    // Kirim pesan kesalahan ke pengguna
    await sock.sendMessage(
      remoteJid,
      {
        text: "Terjadi kesalahan saat memproses data. Silakan coba lagi nanti.",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["addprem", "addpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Hanya owner yang bisa akses
};
