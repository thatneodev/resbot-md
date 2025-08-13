const { registerUser } = require("@lib/users");

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, content } = messageInfo;

  if (content.length < 2) {
    return await sock.sendMessage(
      remoteJid,
      { text: "❗ Contoh: .register nama kamu" },
      { quoted: message }
    );
  }

  if (content.length > 30) {
    return await sock.sendMessage(
      remoteJid,
      { text: "❗ Nama Terlalu Panjang Maksimal 30 karakter" },
      { quoted: message }
    );
  }

    if (content.includes('nama') && content.includes('kamu')) {
    return await sock.sendMessage(
      remoteJid,
      { text: "❗ Nama Tidak valid, Pastikan Gunakan Nama Asli" },
      { quoted: message }
    );
  }


  

  const username = content.toLowerCase();
  const res = registerUser(sender, username);

  if (res === "invalid") {
    await sock.sendMessage(
      remoteJid,
      { text: "❌ Username hanya boleh huruf kecil & angka, tanpa spasi." },
      { quoted: message }
    );
  } else if (res === "registered") {
    await sock.sendMessage(
      remoteJid,
      { text: "✅ Kamu sudah pernah terdaftar! Tidak perlu daftar lagi." },
      { quoted: message }
    );
  } else if (res === "taken") {
    await sock.sendMessage(
      remoteJid,
      {
        text: "❌ Username sudah dipakai orang lain, silakan pilih nama lain.",
      },
      { quoted: message }
    );
  } else {
    // res dianggap userId (register baru)
    await sock.sendMessage(
      remoteJid,
      { text: `✅ Berhasil register sebagai *${username}* !` },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["register"],
  OnlyPremium: false,
  OnlyOwner: false,
};
