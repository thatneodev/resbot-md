// --- Core & Library Imports ---
const mess = require('../../handle/mess'); // Sesuaikan path jika perlu
const response = require('../../handle/respon');
const { findUser, updateUser, isOwner, isPremiumUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');
const axios = require('axios');

// --- Temporary DB for Marriage Proposals ---
const { addProposal, removeProposal, getProposal, isProposalActive, isUserInProposal } = require("../../tmpDB/pasangan"); // Sesuaikan path jika perlu

const WAKTU_LAMARAN = 90; // Waktu menunggu jawaban lamaran dalam detik

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
 * Menampilkan profil user dan pasangannya (jika ada). Ini adalah perintah default.
 */
async function handleDefault(sock, remoteJid, message, userData, messageInfo) {
    const { sender, pushName } = messageInfo;
    
    // --- Bagian Profil User (dari me2.js) ---
    const role = (await isOwner(sender))
        ? "Owner"
        : (await isPremiumUser(sender))
        ? "Premium"
        : userData.role || "User";

    let myProfileText = `
╭─── _*PROFIL KAMU*_
├ Nama : *${pushName}*
├ Role : *${role}*
├ Level: *${userData.level || 0}*
├ Uang : *Rp${(userData.money || 0).toLocaleString('id-ID')}*
╰─────────────────`;

    // --- Bagian Profil Pasangan ---
    const pd = userData.rl?.pd;
    if (!pd) {
        const helpText = `${myProfileText}\n\nAnda belum memiliki pasangan.\n\n*Cara bermain:*\n1. Cari karakter anime: \`.pd cari <nama>\`\n2. Klaim karakter: \`.pd claim <nama>\`\n\n*Atau ajak nikah user lain:*\n- \`.pd nikah @user\`\n\n*Perintah Lainnya (dengan pasangan):*\n- \`.pd putus\`, \`.pd makan\`, \`.pd kerja\`, dll.`;
        return response.sendTextMessage(sock, remoteJid, helpText, message);
    }

    const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
    let partnerProfileText = `💖 *Profil Pasanganmu* 💖\n\n`;
    partnerProfileText += `👤 *Nama:* ${pd.nama}\n`;
    
    if (pd.mal_id) { // Jika pasangan adalah NPC (karakter anime)
         partnerProfileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n`;
         partnerProfileText += `📊 *Level:* ${pd.level} (XP: ${pd.xp}/100)\n`;
         partnerProfileText += `🍎 *Food:* ${pd.food}/100\n`;
         partnerProfileText += `💰 *Uang:* Rp${pd.uang.toLocaleString('id-ID')}\n`;
         partnerProfileText += `🔥 *Horny:* ${pd.horny || 0}/100\n`;
         partnerProfileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
         partnerProfileText += `🤰 *Kehamilan:* ${pd.kehamilan ? `Trimester ${pd.trimester}` : 'Tidak'}\n`;
         partnerProfileText += `\n👨‍👩‍👧‍👦 *Anak:* (${pd.anak.length})\n${pd.anak.length > 0 ? pd.anak.map((a, i) => `  ${i+1}. ${a.nama}`).join('\n') : 'Belum ada'}\n`;
         partnerProfileText += `\n🔗 *Info Karakter:* ${pd.mal_url || 'Tidak ada'}`;
    } else { // Jika pasangan adalah user lain
        partnerProfileText += `❤️ *Status:* Menikah (selama ${relationshipDays} hari)\n`;
        partnerProfileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
    }

    const fullText = `${myProfileText}\n\n${partnerProfileText}`;

    if (pd.img) {
        const imageBuffer = await urlToBuffer(pd.img);
        if (imageBuffer) {
            return response.sendMediaMessage(sock, remoteJid, imageBuffer, fullText, message, 'image');
        }
    }
    await response.sendTextMessage(sock, remoteJid, fullText, message);
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
        nama: charToClaim.name, gender: 'Tergantung Karakter', status: 'Pacaran',
        umurpd: new Date().toISOString(), hubungan: 50, level: 1, xp: 0, food: 100,
        uang: 1000, img: charToClaim.image_url, mal_id: charToClaim.mal_id,
        mal_url: charToClaim.url, anak: [], kehamilan: false, trimester: 0, horny: 0
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
    
    // Jika pasangan adalah NPC, bebaskan karakter
    if (partner.mal_id) {
        releaseCharacter(partner.mal_id);
    } 
    // Jika pasangan adalah user, putuskan hubungan di kedua sisi
    else if (partner.jid) {
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
    if (!pd || !pd.mal_id) return response.sendTextMessage(sock, remoteJid, "Fitur ini hanya untuk pasangan NPC.", message);
    if (pd.food < 20) return response.sendTextMessage(sock, remoteJid, `${pd.nama} lapar! Beri makan dulu dengan .pd makan.`, message);

    let scene = `${pd.nama} meraih tanganmu... Malam itu kalian tenggelam dalam gairah panas... 💦`;
    pd.horny = Math.min((pd.horny || 0) + 50, 100);
    pd.food -= 10;
    pd.xp += 20;
    pd.hubungan = Math.min((pd.hubungan || 50) + 5, 100);

    if (pd.xp >= 100) {
        pd.level += 1;
        pd.xp %= 100;
        scene += `\n\nHubungan kalian makin dalam, level pasanganmu naik ke *Level ${pd.level}*! 🎉`;
    }
    if (Math.random() < 0.3 && !pd.kehamilan) {
        pd.kehamilan = true;
        pd.trimester = 1;
        scene += `\n\nBeberapa minggu kemudian, ${pd.nama} merasa mual... sepertinya ada kehidupan baru yang tumbuh 🤰.`;
    }

    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, scene, message);
}

// ===================================================
// FUNGSI UTAMA (MAIN HANDLE)
// ===================================================
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, command, isGroup, fullText } = messageInfo;

    // --- Parsing Argumen yang Diperbaiki ---
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

                const newPartnerDataForProposer = {
                    nama: proposedData.username, jid: proposed, status: 'Menikah',
                    umurpd: new Date().toISOString(), hubungan: 50,
                };
                 const newPartnerDataForProposed = {
                    nama: proposerData.username, jid: proposer, status: 'Menikah',
                    umurpd: new Date().toISOString(), hubungan: 50,
                };

                updateUser(proposer, { rl: { pd: newPartnerDataForProposer } });
                updateUser(proposed, { rl: { pd: newPartnerDataForProposed } });

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
        if (!mentionedJid || mentionedJid.length === 0) {
            return response.sendTextMessage(sock, remoteJid, 'Siapa yang mau kamu ajak nikah? Tag orangnya! Contoh: `.pd nikah @user`', message);
        }
        
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

        const waitingMessage = `@${sender.split('@')[0]} telah melamar @${proposedJid.split('@')[0]} untuk menikah!\n\n@${proposedJid.split('@')[0]}, kamu punya ${WAKTU_LAMARAN} detik untuk menjawab.\nKetik \`.pd terima\` untuk menerima atau \`.pd tolak\` untuk menolak.`;
        return sock.sendMessage(remoteJid, { text: waitingMessage, mentions: [sender, proposedJid] }, { quoted: message });
    }
    
    // 3. Menjalankan perintah solo (NPC) lainnya atau default
    try {
        const commandMap = {
            'cari': () => handleCari(sock, remoteJid, message, query),
            'claim': () => handleClaim(sock, remoteJid, message, query, userData, sender),
            'putus': () => handlePutus(sock, remoteJid, message, userData, sender),
            'seks': () => handleSeks(sock, remoteJid, message, userData, sender),
            // Tambahkan fungsi lain di sini jika ada, contoh:
            // 'makan': () => handleMakan(sock, remoteJid, message, userData, sender),
            // 'kerja': () => handleKerja(sock, remoteJid, message, userData, sender),
        };

        // Jika subCommand ada dan terdaftar di commandMap, jalankan.
        if (subCommand && commandMap[subCommand]) {
            await commandMap[subCommand]();
        } 
        // Jika subCommand tidak ada (hanya .pd), jalankan default.
        else if (!subCommand) {
            await handleDefault(sock, remoteJid, message, userData, messageInfo);
        } 
        // Jika subCommand ada tapi tidak dikenali.
        else {
            // Abaikan untuk sub-command nikah karena sudah ditangani di atas
            const pvpCommands = ['nikah', 'lamar', 'terima', 'tolak', 'batal'];
            if (!pvpCommands.includes(subCommand)) {
                await response.sendTextMessage(sock, remoteJid, `Perintah \`.pd ${subCommand}\` tidak ditemukan. Ketik \`.pd\` untuk bantuan.`, message);
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
