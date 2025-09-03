const { findUser, updateUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');
const response = require('../../handle/respon');
const axios = require('axios');

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

// --- Bagian Logika Dibagi per Sub-command ---

async function handleDefault(sock, remoteJid, message, userData) {
    const pd = userData.rl?.pd;
    if (!pd) {
        const helpText = `Anda belum memiliki pasangan.\n\n*Cara bermain:*\n1. Cari karakter: \`.pd cari <nama>\`\n2. Klaim karakter: \`.pd claim <nama>\`\n\n*Perintah Lainnya:*\n- \`.pd putus\`: Putus dengan pasangan.\n- \`.pd makan\`: Memberi makan pasangan.\n- \`.pd kerja\`: Pasangan bekerja cari uang.\n- \`.pd sogok\`: Beri hadiah untuk naikin hubungan.\n- \`.pd seks\`: Berhubungan intim.\n- \`.pd hamil\`: Cek & percepat kehamilan.`;
        return response.sendTextMessage(sock, remoteJid, helpText, message);
    }

    const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
    let profileText = `💖 *Profil Pasanganmu* 💖\n\n`;
    profileText += `👤 *Nama:* ${pd.nama}\n`;
    profileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n`;
    profileText += `📊 *Level:* ${pd.level} (XP: ${pd.xp}/100)\n`;
    profileText += `🍎 *Food:* ${pd.food}/100\n`;
    profileText += `💰 *Uang:* Rp${pd.uang.toLocaleString('id-ID')}\n`;
    profileText += `🔥 *Horny:* ${pd.horny || 0}/100\n`;
    profileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
    profileText += `🤰 *Kehamilan:* ${pd.kehamilan ? `Trimester ${pd.trimester}` : 'Tidak'}\n`;
    profileText += `\n👨‍👩‍👧‍👦 *Anak:* (${pd.anak.length})\n${pd.anak.length > 0 ? pd.anak.map((a, i) => `  ${i+1}. ${a.nama}`).join('\n') : 'Belum ada'}\n`;
    profileText += `\n🔗 *Info Karakter:* ${pd.mal_url || 'Tidak ada'}`;

    const imageBuffer = await urlToBuffer(pd.img);
    if (imageBuffer) {
        await response.sendMediaMessage(sock, remoteJid, imageBuffer, profileText, message, 'image');
    } else {
        await response.sendTextMessage(sock, remoteJid, profileText, message);
    }
}

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

async function handlePutus(sock, remoteJid, message, userData, sender) {
    const partner = userData.rl?.pd;
    if (!partner) return response.sendTextMessage(sock, remoteJid, "Anda tidak punya pasangan untuk diputuskan.", message);
    
    releaseCharacter(partner.mal_id);
    
    const updatedUserData = { ...userData };
    delete updatedUserData.rl.pd;
    updateUser(sender, updatedUserData);

    await response.sendTextMessage(sock, remoteJid, `Anda telah putus dengan *${partner.nama}*.`, message);
}

async function handleSeks(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
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

async function handleHamil(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);

    let responseText = '';
    if (!pd.kehamilan) {
        responseText = `${pd.nama} saat ini tidak sedang hamil.`;
    } else {
        pd.trimester++;
        responseText = `Kehamilan ${pd.nama} kini memasuki trimester ${pd.trimester}. Jaga baik-baik ya! ❤️`;
        if (pd.trimester >= 3) {
            const genderAnak = Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan';
            pd.anak.push({ nama: `Anak-${pd.anak.length + 1}`, gender: genderAnak });
            pd.kehamilan = false;
            pd.trimester = 0;
            responseText = `*Selamat!* 🎉 ${pd.nama} telah melahirkan seorang bayi ${genderAnak} yang lucu! 👶✨`;
        }
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

async function handleSogok(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (pd.uang < 500) return response.sendTextMessage(sock, remoteJid, `Uang pasanganmu tidak cukup untuk membeli hadiah. Butuh Rp500, uang saat ini Rp${pd.uang}.`, message);

    pd.uang -= 500;
    pd.hubungan = Math.min((pd.hubungan || 50) + 10, 100);
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, `Kamu memberinya hadiah spesial! Hubungan kalian naik menjadi ${pd.hubungan}! 💝`, message);
}

async function handleMakan(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (pd.food >= 100) return response.sendTextMessage(sock, remoteJid, `${pd.nama} sudah sangat kenyang!`, message);

    pd.food = Math.min(pd.food + 25, 100);
    pd.hubungan = Math.min((pd.hubungan || 50) + 2, 100);
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, `Kamu memberi makan ${pd.nama} dengan lahap. Food naik menjadi ${pd.food}! 🍕`, message);
}

async function handleKerja(sock, remoteJid, message, userData, sender) {
    const pd = userData.rl?.pd;
    if (!pd) return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    if (pd.food < 15) return response.sendTextMessage(sock, remoteJid, `${pd.nama} terlalu lapar untuk bekerja! Beri makan dulu.`, message);

    const earned = Math.floor(Math.random() * 500) + 500;
    pd.uang += earned;
    pd.food -= 15;
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, `${pd.nama} bekerja keras hari ini dan mendapatkan Rp${earned.toLocaleString('id-ID')}! 💼`, message);
}

/**
 * Fungsi utama untuk menangani semua perintah .pd
 */
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    const body = message.conversation || message.imageMessage?.caption || message.videoMessage?.caption || message.extendedTextMessage?.text || '';
    const prefix = '.';
    const command = 'pd';
    if (!body.trim().toLowerCase().startsWith(prefix + command)) return;

    const argsText = body.slice(prefix.length + command.length).trim();
    const args = argsText.split(/ +/).filter(arg => arg !== '');
    const subCommand = args.shift()?.toLowerCase();
    const query = args.join(' ');

    const userArr = findUser(sender);
    if (!userArr) {
        return response.sendTextMessage(sock, remoteJid, "Anda belum terdaftar. Silakan daftar terlebih dahulu.", message);
    }
    const [userId, userData] = userArr;

    try {
        const commandMap = {
            'cari': handleCari,
            'claim': (sock, remoteJid, message) => handleClaim(sock, remoteJid, message, query, userData, sender),
            'putus': (sock, remoteJid, message) => handlePutus(sock, remoteJid, message, userData, sender),
            'seks': (sock, remoteJid, message) => handleSeks(sock, remoteJid, message, userData, sender),
            'hamil': (sock, remoteJid, message) => handleHamil(sock, remoteJid, message, userData, sender),
            'sogok': (sock, remoteJid, message) => handleSogok(sock, remoteJid, message, userData, sender),
            'makan': (sock, remoteJid, message) => handleMakan(sock, remoteJid, message, userData, sender),
            'kerja': (sock, remoteJid, message) => handleKerja(sock, remoteJid, message, userData, sender),
        };

        const handler = commandMap[subCommand];
        if (subCommand && handler) {
            await handler(sock, remoteJid, message, query);
        } else if (!subCommand) {
            await handleDefault(sock, remoteJid, message, userData);
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
