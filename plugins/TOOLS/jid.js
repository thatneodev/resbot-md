async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    await sock.sendMessage(
      remoteJid,
      {
        text: sender,
      },
      { quoted: message }
    );
    return;
  } catch (error) {
    await sock.sendMessage(
      remoteJid,
      { text: "Maaf, terjadi kesalahan" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["id"],
  OnlyPremium: false,
  OnlyOwner: false,
};
