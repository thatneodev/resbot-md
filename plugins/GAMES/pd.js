// --- Core & Library Imports ---
const mess = require('../../handle/mess');
const response = require('../../handle/respon');
const { findUser, updateUser, isOwner, isPremiumUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');
const axios = require('axios');

// --- Temporary DB for Marriage Proposals ---
const { addProposal, removeProposal, getProposal, isProposalActive, isUserInProposal } = require("../../tmpDB/pasangan");

const WAKTU_LAMARAN = 90; // Detik

// --- Utility Functions ---
const urlToBuffer = async (url) => {
    try {
        const result = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(result.data, 'binary');
    } catch (error) {
        console.error("Gagal mengunduh gambar:", error.message);
        return null;
    }
};
const msToDays = (ms) => Math.floor(ms / (1000 * 60 * 60 * 24));

// =============================================================
// --- BAGIAN LOGIKA UNTUK SETIAP SUB-PERINTAH ---
// =============================================================

/**
 * [BARU] Menampilkan daftar perintah yang tersedia.
 */
async function handleHelp(sock, remoteJid, message) {
    const helpText = `
📖 *Bantuan Fitur Pasangan (.pd)* 📖

*SUB-PERINTAH UMUM:*
- \`.pd\`: Lihat profil kamu & pasanganmu.
- \`.pd putus\`: Putus dengan pasangan saat ini.
- \`.pd gift\`: Beri hadiah ke pasangan (biaya: Rp5.000 dari uangmu).

*INTERAKSI DENGAN USER LAIN (PVP):*
- \`.pd nikah @user\`: Lamar seorang user untuk menikah.
- \`.pd terima\`: Terima lamaran nikah.
- \`.pd tolak\`: Tolak lamaran nikah.
- \`.pd batal\`: Batalkan lamaran yang kamu kirim.

*INTERAKSI DENGAN KARAKTER (NPC):*
- \`.pd cari <nama>\`: Cari karakter anime.
- \`.pd claim <nama>\`: Klaim karakter anime sebagai pacar.
- \`.pd status\`: Ubah status hubungan (misal: dari Pacaran ke Menikah).
- \`.pd date\`: Ajak pasangan kencan (biaya: Rp10.000 dari uangmu).
- \`.pd seks\`: Berhubungan intim dengan pasangan.
- \`.pd makan\`: Memberi makan pasangan (meningkatkan Food).
- \`.pd kerja\`: Menyuruh pasangan bekerja (menghasilkan Uang untuk pasangan).
`;
    return response.sendTextMessage(sock, remoteJid, helpText, message);
}

/**
 * Menampilkan profil user dan pasangannya.
 */
async function handleDefault(sock, remoteJid, message, userData, messageInfo) {
    const { sender, pushName } = messageInfo;
    const role = (await isOwner(sender)) ? "Owner" : (await isPremiumUser(sender)) ? "Premium" : userData.role || "User";
    let myProfileText = `
╭─── _*PROFIL KAMU*_
├ Nama : *${pushName}*
├ Role : *${role}*
├ Level: *${userData.level || 0}*
├ Uang : *Rp${(userData.money || 0).toLocaleString('id-ID')}*
╰─────────────────`;
    const pd = userData.rl?.pd;
    if (!pd) {
        const helpText = `${myProfileText}\n\nAnda belum memiliki pasangan.\n\nKetik \`.pd help\` untuk melihat semua perintah yang tersedia.`;
        return response.sendTextMessage(sock, remoteJid, helpText, message);
    }
    const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
    let partnerProfileText = `💖 *Profil Pasanganmu* 💖\n\n`;
    partnerProfileText += `👤 *Nama:* ${pd.nama}\n`;
    if (pd.mal_id) { // Jika pasangan adalah NPC
        partnerProfileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n`;
        partnerProfileText += `📊 *Level:* ${pd.level} (XP: ${pd.xp}/100)\n`;
        partnerProfileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
        partnerProfileText += `🍎 *Food:* ${pd.food}/100\n`;
        partnerProfileText += `💰 *Uang:* Rp${pd.uang.toLocaleString('id-ID')}\n`;
        partnerProfileText += `🔥 *Horny:* ${pd.horny || 0}/100\n`;
    } else { // Jika pasangan adalah User
        partnerProfileText += `❤️ *Status:* Menikah (selama ${relationshipDays} hari)\n`;
        partnerProfileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
    }
    const fullText = `${myProfileText}\n\n${partnerProfileText}`;
    if (pd.img) {
        const imageBuffer = await urlToBuffer(pd.img);
        if (imageBuffer) return response.sendMediaMessage(sock, remoteJid, imageBuffer, fullText, message, 'image');
    }
    await response.sendTextMessage(sock, remoteJid, fullText, message);
}

/**
 * [BARU] Ajak pasangan NPC kencan.
 */
async function handleDate(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    const cost = 10000;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (!pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur kencan hanya untuk pasangan NPC.", message);
    if ((userData.money || 0) < cost) return response.sendTextMessage(sock, remoteJid, `Uangmu tidak cukup untuk kencan. Butuh Rp${cost.toLocaleString('id-ID')}.`, message);

    userData.money -= cost;
    const roll = Math.random();
    let responseText;
    let hub_change = 0, xp_change = 0;

    if (roll < 0.6) { // 60% Sukses
        hub_change = 10; xp_change = 15;
        responseText = `💕 Kencan kalian sukses besar! ${pd.nama} terlihat sangat bahagia.\n\n❤️ Hubungan +${hub_change}\n⭐ XP +${xp_change}`;
    } else if (roll < 0.9) { // 30% Biasa
        hub_change = 5; xp_change = 5;
        responseText = `😊 Kalian menikmati kencan yang menyenangkan.\n\n❤️ Hubungan +${hub_change}\n⭐ XP +${xp_change}`;
    } else { // 10% Gagal
        hub_change = -5;
        responseText = `😥 Sepertinya terjadi sedikit kesalahpahaman saat kencan.\n\n❤️ Hubungan ${hub_change}`;
    }
    pd.hubungan = Math.min(100, (pd.hubungan || 50) + hub_change);
    pd.xp = (pd.xp || 0) + xp_change;
    updateUser(sender, { money: userData.money, rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * [BARU] Beri hadiah pada pasangan (NPC atau User).
 */
async function handleGift(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    const cost = 5000;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if ((userData.money || 0) < cost) return response.sendTextMessage(sock, remoteJid, `Uangmu tidak cukup untuk membeli hadiah. Butuh Rp${cost.toLocaleString('id-ID')}.`, message);
    
    userData.money -= cost;
    pd.hubungan = Math.min(100, (pd.hubungan || 50) + 8);
    updateUser(sender, { money: userData.money, rl: { pd } });

    let responseText = `🎁 Kamu memberikan hadiah spesial untuk ${pd.nama}. Dia sangat menyukainya!\n\n❤️ Hubungan naik menjadi ${pd.hubungan}!`;

    if (pd.jid) { // Jika pasangan adalah user lain
        const [partnerId, partnerData] = findUser(pd.jid) || [null, null];
        if (partnerData && partnerData.rl?.pd) {
            partnerData.rl.pd.hubungan = Math.min(100, (partnerData.rl.pd.hubungan || 50) + 8);
            updateUser(pd.jid, partnerData);
            await sock.sendMessage(pd.jid, { text: `💌 Kamu menerima hadiah dari pasanganmu, ${userData.username}!\n\n❤️ Hubungan kalian naik menjadi ${partnerData.rl.pd.hubungan}!` });
        }
    }
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * [BARU] Ubah status hubungan dengan NPC.
 */
async function handleStatus(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (!pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur ini hanya untuk pasangan NPC.", message);

    if (pd.status === 'Pacaran') {
        if ((pd.hubungan || 50) < 80) {
            return response.sendTextMessage(sock, remoteJid, `Hubungan kalian belum cukup kuat untuk menikah. Tingkatkan dulu hingga 80. (Saat ini: ${pd.hubungan})`, message);
        }
        pd.status = 'Menikah';
        updateUser(sender, { rl: { pd } });
        return response.sendTextMessage(sock, remoteJid, `💍 Selamat! Kamu dan ${pd.nama} sekarang resmi Menikah!`, message);
    } else if (pd.status === 'Menikah') {
        return response.sendTextMessage(sock, remoteJid, `Kamu sudah menikah dengan ${pd.nama}.`, message);
    }
}

/**
 * Mencari karakter anime.
 */
async function handleCari(sock, remoteJid, message, query) {
    if (!query) return response.sendTextMessage(sock, remoteJid, "Masukkan nama karakter. Contoh: `.pd cari Naruto`", message);
    const char = await searchCharacter(query);
    if (!char) return response.sendTextMessage(sock, remoteJid, `Karakter "${query}" tidak ditemukan.`, message);
    const claimantJid = getClaimantInfo(char.mal_id);
    let statusText = `✅ *Status:* Tersedia`;
    let claimSuggestion = `\n\nKetik \`.pd claim ${char.name}\` untuk jadi pasanganmu!`;
    if (claimantJid) {
        const claimantUserArr = findUser(claimantJid);
        const claimantUsername = claimantUserArr ? claimantUserArr[1].username : "Seseorang";
        statusText = `❌ *Status:* Sudah diklaim oleh *${claimantUsername}*`;
        claimSuggestion = "";
    }
    const caption = `*Nama:* ${char.name}\n*Deskripsi:* ${char.about}\n${statusText}${claimSuggestion}`;
    const imageBuffer = await urlToBuffer(char.image_url);
    if (imageBuffer) {
        await response.sendMediaMessage(sock, remoteJid, imageBuffer, caption, message, 'image');
    } else {
        await response.sendTextMessage(sock, remoteJid, caption, message);
    }
}

/**
 * Mengklaim karakter anime sebagai pasangan.
 */
async function handleClaim(sock, remoteJid, message, query, userData, sender) {
    if (userData.rl?.pd) return response.sendTextMessage(sock, remoteJid, "Anda sudah punya pasangan. Putuskan dulu dengan `.pd putus`.", message);
    if (!query) return response.sendTextMessage(sock, remoteJid, "Masukkan nama karakter yang ingin diklaim.", message);
    const charToClaim = await searchCharacter(query);
    if (!charToClaim) return response.sendTextMessage(sock, remoteJid, `Karakter "${query}" tidak ditemukan.`, message);
    const claimantJid = getClaimantInfo(charToClaim.mal_id);
    if (claimantJid) {
        const claimantUserArr = findUser(claimantJid);
        const claimantUsername = claimantUserArr ? claimantUserArr[1].username : "Seseorang";
        return response.sendTextMessage(sock, remoteJid, `Maaf, ${charToClaim.name} sudah diklaim oleh *${claimantUsername}*.`, message);
    }
    claimCharacter(charToClaim.mal_id, sender);
    const newPartner = {
        nama: charToClaim.name, status: 'Pacaran', umurpd: new Date().toISOString(),
        hubungan: 50, level: 1, xp: 0, food: 100, uang: 1000,
        img: charToClaim.image_url, mal_id: charToClaim.mal_id,
        mal_url: charToClaim.url, horny: 0
    };
    updateUser(sender, { rl: { pd: newPartner } });
    await response.sendTextMessage(sock, remoteJid, `Selamat! Anda sekarang resmi berpacaran dengan *${charToClaim.name}*.`, message);
}

/**
 * Memutuskan hubungan dengan pasangan.
 */
async function handlePutus(sock, remoteJid, message, userData, sender) {
    const partner = userData.rl?.pd;
    if (!partner) return response.sendTextMessage(sock, remoteJid, "Anda tidak punya pasangan untuk diputuskan.", message);
    if (partner.mal_id) { // Jika pasangan NPC
        releaseCharacter(partner.mal_id);
    } else if (partner.jid) { // Jika pasangan User
        const [partnerId, partnerData] = findUser(partner.jid) || [null, null];
        if (partnerData && partnerData.rl?.pd) {
            delete partnerData.rl.pd;
            updateUser(partner.jid, partnerData);
            sock.sendMessage(partner.jid, { text: `💔 Hubunganmu dengan ${userData.username} telah berakhir.` });
        }
    }
    const updatedUserData = { ...userData };
    delete updatedUserData.rl.pd;
    updateUser(sender, updatedUserData);
    await response.sendTextMessage(sock, remoteJid, `Anda telah putus dengan *${partner.nama}*.`, message);
}

/**
 * Berhubungan intim dengan pasangan NPC.
 */
async function handleSeks(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (!pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur ini hanya untuk pasangan NPC.", message);
    if (pd.food < 20) return response.sendTextMessage(sock, remoteJid, `${pd.nama} lapar! Beri makan dulu dengan .pd makan.`, message);
    let scene = `${pd.nama} meraih tanganmu... Malam itu kalian tenggelam dalam gairah panas... 💦`;
    pd.horny = Math.min(100, (pd.horny || 0) + 50);
    pd.food -= 10;
    pd.xp += 20;
    pd.hubungan = Math.min(100, (pd.hubungan || 50) + 5);
    if (pd.xp >= 100) {
        pd.level += 1;
        pd.xp %= 100;
        scene += `\n\nHubungan kalian makin dalam, level pasanganmu naik ke *Level ${pd.level}*! 🎉`;
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, scene, message);
}

/**
 * Memberi makan pasangan NPC.
 */
async function handleMakan(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (!pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur ini hanya untuk pasangan NPC.", message);
    if (pd.food >= 100) return response.sendTextMessage(sock, remoteJid, `${pd.nama} sudah sangat kenyang!`, message);
    pd.food = Math.min(100, pd.food + 25);
    pd.hubungan = Math.min(100, (pd.hubungan || 50) + 2);
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, `Kamu memberi makan ${pd.nama} dengan lahap. Food naik menjadi ${pd.food}! 🍕`, message);
}

/**
 * Menyuruh pasangan NPC bekerja.
 */
async function handleKerja(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (!pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur ini hanya untuk pasangan NPC.", message);
    if (pd.food < 15) return response.sendTextMessage(sock, remoteJid, `${pd.nama} terlalu lapar untuk bekerja! Beri makan dulu.`, message);
    const earned = Math.floor(Math.random() * 500) + 500;
    pd.uang += earned;
    pd.food -= 15;
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, `${pd.nama} bekerja keras hari ini dan mendapatkan Rp${earned.toLocaleString('id-ID')}! 💼`, message);
}

// ===================================================
// FUNGSI UTAMA (MAIN HANDLE)
// ===================================================
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, command, isGroup, fullText } = messageInfo;

    const args = fullText.split(' ').slice(1);
    const subCommand = args[0] ? args[0].toLowerCase() : null;
    const query = args.slice(1).join(' ');
    
    // 1. Cek lamaran yang sedang berlangsung di grup ini
    if (isProposalActive(remoteJid)) {
        const currentProposal = getProposal(remoteJid);
        const { proposer, proposed } = currentProposal;

        if (sender === proposed) { // Jika yang dilamar merespon
            if (subCommand === 'terima') {
                const [proposerId, proposerData] = findUser(proposer) || [null, null];
                const [proposedId, proposedData] = findUser(proposed) || [null, null];

                if (!proposerData || !proposedData) {
                    removeProposal(remoteJid);
                    return sock.sendMessage(remoteJid, { text: "Terjadi kesalahan, salah satu pengguna tidak ditemukan." }, { quoted: message });
                }
                const newPartnerForProposer = { nama: proposedData.username, jid: proposed, status: 'Menikah', umurpd: new Date().toISOString(), hubungan: 50 };
                const newPartnerForProposed = { nama: proposerData.username, jid: proposer, status: 'Menikah', umurpd: new Date().toISOString(), hubungan: 50 };
                updateUser(proposer, { rl: { pd: newPartnerForProposer } });
                updateUser(proposed, { rl: { pd: newPartnerForProposed } });

                removeProposal(remoteJid);
                return sock.sendMessage(remoteJid, { text: `🎉 Selamat! @${proposer.split('@')[0]} dan @${proposed.split('@')[0]} sekarang resmi menikah!`, mentions: [proposer, proposed]}, { quoted: message });
            } else if (subCommand === 'tolak') {
                removeProposal(remoteJid);
                return sock.sendMessage(remoteJid, { text: `💔 Yah, @${proposed.split('@')[0]} menolak lamaran dari @${proposer.split('@')[0]}.`, mentions: [proposer, proposed]}, { quoted: message });
            }
        } else if (sender === proposer && subCommand === 'batal') { // Jika pelamar membatalkan
             removeProposal(remoteJid);
             return sock.sendMessage(remoteJid, { text: `Lamaran dari @${proposer.split('@')[0]} telah dibatalkan.`, mentions: [proposer] }, { quoted: message });
        } else { // Jika orang lain mencoba memulai perintah baru
             await sock.sendMessage(remoteJid, { text: mess.game.isPlaying }, { quoted: message });
        }
        return; // Hentikan eksekusi jika ada lamaran aktif
    }
    
    // 2. Jika tidak ada lamaran aktif, proses perintah baru
    const [userId, userData] = findUser(sender) || [null, null];
    if (!userData) return response.sendTextMessage(sock, remoteJid, "Anda belum terdaftar.", message);

    // Sub-command untuk memulai lamaran
    if (subCommand === 'nikah' || subCommand === 'lamar') {
        if (!isGroup) return sock.sendMessage(remoteJid, { text: 'Fitur ini hanya bisa digunakan di dalam grup.' }, { quoted: message });
        if (userData.rl?.pd) return response.sendTextMessage(sock, remoteJid, "Anda sudah punya pasangan. Putuskan dulu dengan `.pd putus`.", message);
        if (isUserInProposal(sender)) return response.sendTextMessage(sock, remoteJid, "Anda sedang terlibat dalam lamaran lain, selesaikan dulu.", message);
        const mentionedJid = message.extendedTextMessage?.contextInfo?.mentionedJid;
        if (!mentionedJid || mentionedJid.length === 0) return response.sendTextMessage(sock, remoteJid, 'Siapa yang mau kamu ajak nikah? Tag orangnya! Contoh: `.pd nikah @user`', message);
        const proposedJid = mentionedJid[0];
        if (proposedJid === sender) return response.sendTextMessage(sock, remoteJid, 'Tidak bisa menikah dengan diri sendiri!', message);
        const [proposedId, proposedData] = findUser(proposedJid) || [null, null];
        if (!proposedData) return response.sendTextMessage(sock, remoteJid, 'Orang yang Anda tag belum terdaftar.', message);
        if (proposedData.rl?.pd) return response.sendTextMessage(sock, remoteJid, `Maaf, ${proposedData.username} sudah memiliki pasangan.`, message);
        addProposal(remoteJid, { proposer: sender, proposed: proposedJid, state: 'WAITING' });
        setTimeout(async () => {
            if (isProposalActive(remoteJid)) {
                const current = getProposal(remoteJid);
                if (current && current.proposer === sender) {
                    removeProposal(remoteJid);
                    await sock.sendMessage(remoteJid, { text: `⏳ Waktu habis! Lamaran untuk @${proposedJid.split('@')[0]} dibatalkan.`, mentions: [proposedJid] }, { quoted: message });
                }
            }
        }, WAKTU_LAMARAN * 1000);
        const waitingMessage = `@${sender.split('@')[0]} telah melamar @${proposedJid.split('@')[0]} untuk menikah!\n\n@${proposedJid.split('@')[0]}, kamu punya ${WAKTU_LAMARAN} detik untuk menjawab.\nKetik \`.pd terima\` atau \`.pd tolak\`.`;
        return sock.sendMessage(remoteJid, { text: waitingMessage, mentions: [sender, proposedJid] }, { quoted: message });
    }
    
    // 3. Menjalankan perintah solo lainnya atau default
    try {
        const commandMap = {
            'help': () => handleHelp(sock, remoteJid, message),
            'date': () => handleDate(sock, remoteJid, message, userData, sender),
            'gift': () => handleGift(sock, remoteJid, message, userData, sender),
            'status': () => handleStatus(sock, remoteJid, message, userData, sender),
            'cari': () => handleCari(sock, remoteJid, message, query),
            'claim': () => handleClaim(sock, remoteJid, message, query, userData, sender),
            'putus': () => handlePutus(sock, remoteJid, message, userData, sender),
            'seks': () => handleSeks(sock, remoteJid, message, userData, sender),
            'makan': () => handleMakan(sock, remoteJid, message, userData, sender),
            'kerja': () => handleKerja(sock, remoteJid, message, userData, sender),
        };
        if (subCommand && commandMap[subCommand]) {
            await commandMap[subCommand]();
        } else if (!subCommand) {
            await handleDefault(sock, remoteJid, message, userData, messageInfo);
        } else {
            const pvpCommands = ['nikah', 'lamar', 'terima', 'tolak', 'batal'];
            if (!pvpCommands.includes(subCommand)) {
                await response.sendTextMessage(sock, remoteJid, `Perintah \`.pd ${subCommand}\` tidak ditemukan. Ketik \`.pd help\` untuk bantuan.`, message);
            }
        }
    } catch (error) {
        console.error(`Error pada perintah .pd: ${error}`);
        await response.sendTextMessage(sock, remoteJid, "Maaf, terjadi kesalahan pada sistem.", message);
    }
}

module.exports = {
    handle,
    Commands: ["pd", "pasangan"],
    OnlyPremium: false,
    OnlyOwner: false
};
