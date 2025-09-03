// --- Core & Library Imports ---
const mess = require('../../handle/mess'); // Sesuaikan path jika perlu
const response = require('../../handle/respon');
const { findUser, updateUser, isOwner, isPremiumUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');
const axios = require('axios');

// --- Temporary DB for Marriage Proposals ---
const { addProposal, removeProposal, getProposal, isProposalActive, isUserInProposal } = require("@tmpDB/pasangan"); // Sesuaikan path jika perlu

const WAKTU_LAMARAN = 90; // Waktu menunggu jawaban lamaran dalam detik

// --- Utility Functions (sama seperti sebelumnya) ---
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

// --- Bagian Logika Profil (mengikuti me2.js) & Pasangan NPC ---

async function handleDefault(sock, remoteJid, message, userData) {
    const { sender, pushName } = messageInfo; // Pastikan messageInfo di-pass ke fungsi ini
    
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

    // --- Bagian Profil Pasangan (dari pd.js lama) ---
    const pd = userData.rl?.pd;
    if (!pd) {
        const helpText = `${myProfileText}\n\nAnda belum memiliki pasangan.\n\n*Cara bermain:*\n1. Cari karakter anime: \`.pd cari <nama>\`\n2. Klaim karakter: \`.pd claim <nama>\`\n\n*Atau ajak nikah user lain:*\n- \`.pd nikah @user\`\n\n*Perintah Lainnya (dengan pasangan):*\n- \`.pd putus\`, \`.pd makan\`, \`.pd kerja\`, dll.`;
        return response.sendTextMessage(sock, remoteJid, helpText, message);
    }

    const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
    let partnerProfileText = `💖 *Profil Pasanganmu* 💖\n\n`;
    partnerProfileText += `👤 *Nama:* ${pd.nama}\n`;
    // Cek apakah pasangan adalah NPC atau User
    if (pd.mal_id) {
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

// ... (Salin semua fungsi handleCari, handleClaim (NPC), handlePutus, handleSeks, dll dari kode lama Anda di sini)
// ... Pastikan fungsi-fungsi ini tidak di-export, karena akan dipanggil dari handle utama.

// Contoh fungsi handleCari (tetap sama)
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

// ... (DAN SEMUA FUNGSI LAINNYA: handleClaim, handlePutus, handleSeks, handleHamil, handleSogok, handleMakan, handleKerja)


/**
 * ===================================================
 * FUNGSI UTAMA (MAIN HANDLE) - Mengikuti Pola TicTacToe
 * ===================================================
 */
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, command, pushName, isGroup } = messageInfo;

    // Parsing argumen
    const body = message.conversation || message.imageMessage?.caption || message.videoMessage?.caption || message.extendedTextMessage?.text || '';
    const argsText = body.slice(1 + command.length).trim();
    const args = argsText.split(/ +/).filter(arg => arg !== '');
    const subCommand = args.shift()?.toLowerCase();
    const query = args.join(' ');
    
    // 1. Cek apakah ada lamaran yang sedang berlangsung di grup ini
    if (isProposalActive(remoteJid)) {
        const currentProposal = getProposal(remoteJid);
        const { proposer, proposed } = currentProposal;

        // Jika yang dilamar merespon
        if (sender === proposed) {
            if (subCommand === 'terima') {
                const [proposerId, proposerData] = findUser(proposer);
                const [proposedId, proposedData] = findUser(proposed);

                const newPartnerDataForProposer = {
                    nama: proposedData.username,
                    jid: proposed,
                    status: 'Menikah',
                    umurpd: new Date().toISOString(),
                    hubungan: 50,
                    img: null // Bisa ditambahkan fitur set pp pasangan nanti
                };
                 const newPartnerDataForProposed = {
                    nama: proposerData.username,
                    jid: proposer,
                    status: 'Menikah',
                    umurpd: new Date().toISOString(),
                    hubungan: 50,
                    img: null
                };

                updateUser(proposer, { rl: { pd: newPartnerDataForProposer } });
                updateUser(proposed, { rl: { pd: newPartnerDataForProposed } });

                removeProposal(remoteJid);
                return sock.sendMessage(remoteJid, { text: `🎉 Selamat! @${proposer.split('@')[0]} dan @${proposed.split('@')[0]} sekarang resmi menikah!`, mentions: [proposer, proposed]}, { quoted: message });

            } else if (subCommand === 'tolak') {
                removeProposal(remoteJid);
                return sock.sendMessage(remoteJid, { text: `💔 Yah, @${proposed.split('@')[0]} menolak lamaran dari @${proposer.split('@')[0]}.`, mentions: [proposer, proposed]}, { quoted: message });
            }
        }
        // Jika pelamar membatalkan
        else if (sender === proposer && subCommand === 'batal') {
             removeProposal(remoteJid);
             return sock.sendMessage(remoteJid, { text: `Lamaran dari @${proposer.split('@')[0]} telah dibatalkan.`, mentions: [proposer] }, { quoted: message });
        }
        // Jika orang lain mencoba memulai game baru
        else {
             await sock.sendMessage(remoteJid, { text: mess.game.isPlaying }, { quoted: message });
        }
        return; // Menghentikan eksekusi lebih lanjut
    }
    
    // 2. Jika tidak ada lamaran aktif, proses perintah baru
    const [userId, userData] = findUser(sender) || [null, null];
    if (!userData) return response.sendTextMessage(sock, remoteJid, "Anda belum terdaftar.", message);

    // Sub-command untuk memulai lamaran (seperti memulai TicTacToe)
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

        // Tambahkan ke DB sementara
        addProposal(remoteJid, {
            proposer: sender,
            proposed: proposedJid,
            state: 'WAITING',
        });
        
        // Atur timeout
        setTimeout(async () => {
            if (isProposalActive(remoteJid)) {
                const current = getProposal(remoteJid);
                if (current.proposer === sender) { // Pastikan proposal masih sama
                    removeProposal(remoteJid);
                    await sock.sendMessage(remoteJid, { text: `⏳ Waktu habis! Lamaran untuk @${proposedJid.split('@')[0]} dibatalkan.`, mentions: [proposedJid] }, { quoted: message });
                }
            }
        }, WAKTU_LAMARAN * 1000);

        // Kirim pesan menunggu
        const waitingMessage = `@${sender.split('@')[0]} telah melamar @${proposedJid.split('@')[0]} untuk menikah!\n\n@${proposedJid.split('@')[0]}, kamu punya ${WAKTU_LAMARAN} detik untuk menjawab.\nKetik \`.pd terima\` untuk menerima atau \`.pd tolak\` untuk menolak.`;
        return sock.sendMessage(remoteJid, { text: waitingMessage, mentions: [sender, proposedJid] }, { quoted: message });
    }
    
    // 3. Menjalankan perintah solo (NPC) lainnya
    try {
        const commandMap = {
            'cari': (sock, m, msg) => handleCari(sock, remoteJid, message, query),
            'claim': (sock, m, msg) => handleClaim(sock, remoteJid, message, query, userData, sender), // Pastikan handleClaim di-copy
            'putus': (sock, m, msg) => handlePutus(sock, remoteJid, message, userData, sender),     // Pastikan handlePutus di-copy
            'seks': (sock, m, msg) => handleSeks(sock, remoteJid, message, userData, sender),       // ...dan seterusnya
            'hamil': (sock, m, msg) => handleHamil(sock, remoteJid, message, userData, sender),
            'sogok': (sock, m, msg) => handleSogok(sock, remoteJid, message, userData, sender),
            'makan': (sock, m, msg) => handleMakan(sock, remoteJid, message, userData, sender),
            'kerja': (sock, m, msg) => handleKerja(sock, remoteJid, message, userData, sender),
        };

        const handler = commandMap[subCommand];
        if (subCommand && handler) {
            await handler(sock, remoteJid, message, query);
        } else if (!subCommand) {
            // Pass messageInfo ke handleDefault agar bisa ambil pushName & sender
            await handleDefault(sock, remoteJid, message, userData, messageInfo);
        } else {
            await response.sendTextMessage(sock, remoteJid, `Perintah \`.pd ${subCommand}\` tidak ditemukan. Ketik \`.pd\` untuk bantuan.`, message);
        }
    } catch (error) {
        console.error("Error pada perintah .pd:", error);
        await response.sendTextMessage(sock, remoteJid, "Maaf, terjadi kesalahan pada sistem.", message);
    }
}

module.exports = {
    handle,
    Commands: ["pd", "pasangan"],
    OnlyPremium: false,
    OnlyOwner: false
};
