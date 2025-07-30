const { sendMessageWithMention } = require("@lib/utils");
const { listOwner } = require("@lib/users");
const config = require("@config");

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, senderType } = messageInfo;

  const data = await listOwner();

  let list = [];

  let no = 1;
  for (const item of data) {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:Owner ${no}
FN:Owner ${no}
TEL;waid=${item.split("@")[0]}:${item.split("@")[0]}
EMAIL;type=INTERNET:${config.owner_email}
URL:https://autoresbot.com
ADR:;;${config.region};;;
END:VCARD`;
    list.push({
      displayName: `Owner ${no}`,
      vcard: vcard,
    });
    no++;
  }

  if (data.length === 0) {
    return await sendMessageWithMention(
      sock,
      remoteJid,
      "Owner belum terdaftar!",
      message,
      senderType
    );
  }

  // Mengirim pesan kontak
  const chatId = await sock.sendMessage(
    remoteJid,
    {
      contacts: {
        displayName: data,
        contacts: list,
      },
    },
    { quoted: message }
  );

  // Kirim pesan dengan mention
  await sendMessageWithMention(
    sock,
    remoteJid,
    `Hai Kak @${sender.split("@")[0]}, berikut adalah daftar owner bot ini`,
    chatId,
    senderType
  );
}

module.exports = {
  handle,
  Commands: ["owner"],
  OnlyPremium: false,
  OnlyOwner: false,
};
