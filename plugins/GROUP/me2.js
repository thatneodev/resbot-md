const { findUser } = require("@lib/users");
const { isOwner, isPremiumUser } = require("@lib/users");

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, pushName } = messageInfo;

  // Ambil data pengguna
  const dataUsers = await findUser(sender);
  if (!dataUsers) return;

  const [docId, userData] = dataUsers;

  const role = (await isOwner(sender))
    ? "Owner"
    : (await isPremiumUser(sender))
    ? "Premium"
    : userData.role;

  let teks = `
╭─── _*MY PROFILE*_ 
├────
├──
│ Username  : *${userData.username}*
│ Level : *${userData.level || 0}*
│ Limit : *${userData.limit || 0}*
│ Money : *${userData.money || 0}*
│ Role : *${role}*
│
├────
╰────────────────────────`;

  await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
}

module.exports = {
  handle,
  Commands: ["me2", "limit2"],
  OnlyPremium: false,
  OnlyOwner: false,
};
