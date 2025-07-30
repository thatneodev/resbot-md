const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");

async function handle(sock, messageInfo) {
  const { remoteJid, message, command } = messageInfo;
  try {
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer(`/api/random/${command}`);

    await sock.sendMessage(
      remoteJid,
      { image: buffer, caption: mess.general.success },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error.message);
    const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n*Detail Kesalahan:* ${
      error.message || "Kesalahan tidak diketahui"
    }`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: [
    "aesthetic",
    "cecan",
    "cogan",
    "cosplay",
    "darkjoke",
    "hacker",
    "kucing",
    "memeindo",
    "motivasi",
    "thailand",
    "vietnam",
    "walhp",
  ],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi
};
