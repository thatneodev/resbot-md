const { findUser, updateUser } = require("@lib/users");
const { determineUser, extractNumber, sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    content,
    sender,
    prefix,
    command,
    mentionedJid,
    isQuoted,
    senderType,
  } = messageInfo;

  // Validasi input kosong
  if (!content || content.trim() === "") {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } 628xxx 10*_`,
      },
      { quoted: message }
    );
  }

  // Pisahkan nomor dan jumlah level
  const [rawNumber, rawLevel] = content.split(" ").map((item) => item.trim());

  // Menentukan pengguna
  const userToAction = determineUser(
    mentionedJid,
    isQuoted,
    rawNumber,
    senderType
  );
  if (!userToAction) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } 628xxx 50*_`,
      },
      { quoted: message }
    );
  }

  if (!userToAction || !rawLevel) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_Masukkan format yang benar_\n\n_Contoh: *${
          prefix + command
        } 628xxx 50*_`,
      },
      { quoted: message }
    );
  }

  // Validasi level
  const levelToAdd = parseInt(rawLevel, 10);
  if (isNaN(levelToAdd) || levelToAdd <= 0) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `⚠️ _Jumlah level harus berupa angka positif_\n\n_Contoh: *${
          prefix + command
        } 628xxx 5*_`,
      },
      { quoted: message }
    );
  }


  // Ambil data pengguna
  const dataUsers = await findUser(userToAction);
  if (!dataUsers) {
    return await sock.sendMessage(
      remoteJid,
      { text: `⚠️ _Pengguna dengan nomor ${userToAction} tidak ditemukan._` },
      { quoted: message }
    );
  }

  const [docId, userData] = dataUsers;

  // Update data pengguna
  await updateUser(userToAction, {
    level: (userData.level || 0) + levelToAdd, // Tambah level
  });

  const rawTagNumber = `@${extractNumber(userToAction)}`;

    // Kirim pesan dengan mention
    await sendMessageWithMention(
      sock,
      remoteJid,
       `✅ _Level berhasil ditambah ${levelToAdd} untuk nomor ${rawTagNumber}._`,
      message,
      senderType
    );
    return


}

module.exports = {
  handle,
  Commands: ["addlevel"],
  OnlyPremium: false,
  OnlyOwner: true,
};
