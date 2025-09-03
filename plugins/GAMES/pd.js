const { findUser, updateUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');
const response = require('../../handle/respon');
const axios = require('axios');

/**
 * Helper function untuk mengunduh gambar dari URL menjadi buffer
 * @param {string} url URL gambar
 * @returns {Buffer|null} Buffer gambar atau null jika gagal
 */
const urlToBuffer = async (url) => {
    try {
        const result = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(result.data, 'binary');
    } catch (error) {
        console.error("Gagal mengunduh gambar dari URL:", error);
        return null;
    }
};

// Fungsi helper untuk konversi milidetik ke hari
const msToDays = (ms) => Math.floor(ms / (1000 * 60 * 60 * 24));

/**
 * Fungsi untuk menangani tampilan profil atau help jika tidak ada subcommand
 */
async function handlePdDefault(sock, remoteJid, message, userData) {
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

/**
 * Fungsi untuk menangani subcommand 'cari'
 */
async function handlePdCari(sock, remoteJid, message, query) {
    if (!query) return response.sendTextMessage(sock, remoteJid, "Masukkan nama karakter yang ingin dicari. Contoh: `.pd cari Naruto`", message);
    
    const char = await searchCharacter(query);
    if (!char) return response.sendTextMessage(sock, remoteJid, `Karakter dengan nama "${query}" tidak ditemukan.`, message);
    
    const claimantName = getClaimantInfo(char.mal_id);
    let statusText = `✅ *Status:* Tersedia`;
    let claimSuggestion = `\n\nKetik \`.pd claim ${char.name}\` untuk menjadikan karakter ini pasanganmu!`;

    if (claimantName) {
        const claimantUser = findUser(claimantName);
        const claimantUsername = claimantUser ? claimantUser[1].username : "Seseorang";
        statusText = `❌ *Status:* Sudah diklaim oleh *${claimantUsername}*`;
        claimSuggestion = "";
    }

    const searchResult = `*Nama:* ${char.name}\n*Deskripsi:* ${char.about}\n${statusText}${claimSuggestion}`;
    
    const imageBuffer = await urlToBuffer(char.image_url);
    if (imageBuffer) {
        await response.sendMediaMessage(sock, remoteJid, imageBuffer, searchResult, message, 'image');
    } else {
        await response.sendTextMessage(sock, remoteJid, searchResult, message);
    }
}

/**
 * Fungsi untuk menangani subcommand 'claim'
 */
async function handlePdClaim(sock, remoteJid, message, query, userData, sender) {
    if (userData.rl?.pd) return response.sendTextMessage(sock, remoteJid, "Anda sudah memiliki pasangan. Ketik `.pd putus` terlebih dahulu.", message);
    if (!query) return response.sendTextMessage(sock, remoteJid, "Masukkan nama karakter yang ingin diklaim.", message);

    const charToClaim = await searchCharacter(query);
    if (!charToClaim) return response.sendTextMessage(sock, remoteJid, `Karakter "${query}" tidak ditemukan.`, message);
    
    const claimant = getClaimantInfo(charToClaim.mal_id);
    if (claimant) {
         const claimantUser = findUser(claimant);
         const claimantUsername = claimantUser ? claimantUser[1].username : "Seseorang";
         return response.sendTextMessage(sock, remoteJid, `Maaf, ${charToClaim.name} sudah diklaim oleh *${claimantUsername}*.`, message);
    }
    
    claimCharacter(charToClaim.mal_id, sender);
    const newPartnerData = {
        nama: charToClaim.name, gender: 'Tergantung Karakter', status: 'Pacaran',
        umurpd: new Date().toISOString(), hubungan: 50, level: 1, xp: 0, food: 100,
        uang: 1000, img: charToClaim.image_url, mal_id: charToClaim.mal_id,
        mal_url: charToClaim.url, anak: [], kehamilan: false, trimester: 0, horny: 0
    };

    updateUser(sender, { rl: { pd: newPartnerData } });
    await response.sendTextMessage(sock, remoteJid, `Selamat! Anda sekarang resmi berpacaran dengan *${charToClaim.name}*.`, message);
}

/**
 * Fungsi untuk menangani subcommand 'putus'
 */
async function handlePdPutus(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) return response.sendTextMessage(sock, remoteJid, "Anda tidak memiliki pasangan untuk diputuskan.", message);
    
    const partnerToRelease = userData.rl.pd;
    releaseCharacter(partnerToRelease.mal_id);
    
    const updatedUser = { ...userData };
    delete updatedUser.rl.pd;
    updateUser(sender, updatedUser);

    await response.sendTextMessage(sock, remoteJid, `Anda telah putus dengan *${partnerToRelease.nama}*.`, message);
}

/**
 * Fungsi untuk menangani subcommand 'seks'
 */
async function handlePdSeks(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) {
        return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    }
    const pd = userData.rl.pd;
    let responseText = '';
    if (pd.food < 20) {
        responseText = `${pd.nama} lapar! Beri makan dulu.`;
    } else {
        responseText = `${pd.nama} meraih tanganmu... Malam itu kalian tenggelam dalam gairah panas... 💦`;
        pd.horny = Math.min((pd.horny || 0) + 50, 100);
        pd.food -= 10;
        pd.xp += 20;
        pd.hubungan = Math.min((pd.hubungan || 50) + 5, 100);
        if (pd.xp >= 100) {
            pd.level += 1;
            pd.xp %= 100;
            responseText += `\n\nLevel pasanganmu naik ke *Level ${pd.level}*! 🎉`;
        }
        if (Math.random() < 0.3 && !pd.kehamilan) {
            pd.kehamilan = true;
            pd.trimester = 1;
            responseText += `\n\nBeberapa minggu kemudian, ${pd.nama} merasa mual... 🤰.`;
        }
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * Fungsi untuk menangani subcommand 'hamil'
 */
async function handlePdHamil(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) {
        return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    }
    const pd = userData.rl.pd;
    let responseText = '';
    if (!pd.kehamilan) {
        responseText = `${pd.nama} belum hamil.`;
    } else {
        pd.trimester++;
        responseText = `${pd.nama} kini memasuki trimester ${pd.trimester}.`;
        if (pd.trimester >= 3) {
            const genderAnak = Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan';
            pd.anak.push({ nama: `Anak-${pd.anak.length + 1}`, gender: genderAnak });
            pd.kehamilan = false;
            pd.trimester = 0;
            responseText = `*Selamat!* ${pd.nama} melahirkan seorang bayi ${genderAnak} yang mungil! 👶✨`;
        }
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * Fungsi untuk menangani subcommand 'sogok'
 */
async function handlePdSogok(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) {
        return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    }
    const pd = userData.rl.pd;
    let responseText = '';
    if (pd.uang < 500) {
        responseText = "Uang pasanganmu kurang untuk disogok.";
    } else {
        pd.uang -= 500;
        pd.hubungan = Math.min((pd.hubungan || 50) + 10, 100);
        responseText = `Kamu memberi hadiah, hubungan kalian naik menjadi ${pd.hubungan}! 💝`;
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * Fungsi untuk menangani subcommand 'makan'
 */
async function handlePdMakan(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) {
        return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    }
    const pd = userData.rl.pd;
    let responseText = '';
    if (pd.food >= 100) {
        responseText = `${pd.nama} sudah kenyang!`;
    } else {
        pd.food = Math.min(pd.food + 25, 100);
        pd.hubungan = Math.min((pd.hubungan || 50) + 2, 100);
        responseText = `Kamu memberi makan ${pd.nama}. Food naik jadi ${pd.food}!`;
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * Fungsi untuk menangani subcommand 'kerja'
 */
async function handlePdKerja(sock, remoteJid, message, userData, sender) {
    if (!userData.rl?.pd) {
        return response.sendTextMessage(sock, remoteJid, "Kamu belum punya pasangan.", message);
    }
    const pd = userData.rl.pd;
    let responseText = '';
    if (pd.food < 15) {
        responseText = `${pd.nama} terlalu lapar untuk bekerja!`;
    } else {
        const earned = Math.floor(Math.random() * 500) + 500;
        pd.uang += earned;
        pd.food -= 15;
        responseText = `${pd.nama} bekerja dan dapat Rp${earned.toLocaleString('id-ID')}! 💼`;
    }
    updateUser(sender, { rl: { pd } });
    await response.sendTextMessage(sock, remoteJid, responseText, message);
}

/**
 * Fungsi utama untuk menangani semua perintah terkait .pd (pasangan)
 */
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    const body = message.conversation ||
                 message.imageMessage?.caption ||
                 message.videoMessage?.caption ||
                 message.extendedTextMessage?.text ||
                 '';

    const prefix = '.';
    const command = 'pd';
    if (!body || !body.trim().toLowerCase().startsWith(prefix + command)) {
        return;
    }

    const argsText = body.slice(prefix.length + command.length).trim();
    const args = argsText.split(/ +/).filter(arg => arg !== '');
    const subCommand = args.shift()?.toLowerCase();
    const query = args.join(' ');

    const userArr = findUser(sender);
    if (!userArr) {
        return response.sendTextMessage(sock, remoteJid, "Anda belum terdaftar di database. Silakan daftar terlebih dahulu.", message);
    }
    const [userId, userData] = userArr;

    try {
        if (!subCommand) {
            return await handlePdDefault(sock, remoteJid, message, userData);
        }

        switch (subCommand) {
            case 'cari':
                await handlePdCari(sock, remoteJid, message, query);
                break;
            case 'claim':
                await handlePdClaim(sock, remoteJid, message, query, userData, sender);
                break;
            case 'putus':
                await handlePdPutus(sock, remoteJid, message, userData, sender);
                break;
            case 'seks':
                await handlePdSeks(sock, remoteJid, message, userData, sender);
                break;
            case 'hamil':
                await handlePdHamil(sock, remoteJid, message, userData, sender);
                break;
            case 'sogok':
                await handlePdSogok(sock, remoteJid, message, userData, sender);
                break;
            case 'makan':
                await handlePdMakan(sock, remoteJid, message, userData, sender);
                break;
            case 'kerja':
                await handlePdKerja(sock, remoteJid, message, userData, sender);
                break;
            default:
                await response.sendTextMessage(sock, remoteJid, `Perintah \`.pd ${subCommand}\` tidak ditemukan. Ketik \`.pd\` untuk melihat daftar perintah.`, message);
                break;
        }
    } catch (error) {
        console.error("Terjadi error pada perintah .pd:", error);
        await response.sendTextMessage(sock, remoteJid, "Maaf, terjadi kesalahan pada sistem.", message);
    }
}

module.exports = {
    handle,
    Commands: ["pd", "pasangan"],
    OnlyPremium: false,
    OnlyOwner: false
};
