const { findUser, updateUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');

// Fungsi helper untuk konversi milidetik ke hari
const msToDays = (ms) => Math.floor(ms / (1000 * 60 * 60 * 24));

/**
 * Fungsi utama untuk menangani semua perintah terkait .pd (pasangan)
 */
async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    // --- PARSER PERINTAH YANG DIPERBAIKI ---
    // 1. Dapatkan teks dari berbagai kemungkinan sumber (pesan biasa, caption, dll)
    const body = message.conversation ||
                 message.imageMessage?.caption ||
                 message.videoMessage?.caption ||
                 message.extendedTextMessage?.text ||
                 '';

    // 2. Cek apakah pesan dimulai dengan command. Sesuaikan prefix jika perlu.
    const prefix = '.';
    const command = 'pd';
    if (!body.trim().toLowerCase().startsWith(prefix + command)) {
        return; // Bukan perintah .pd, abaikan
    }

    // 3. Pisahkan subcommand dan query
    const argsText = body.slice(prefix.length + command.length).trim();
    const args = argsText.split(/ +/);
    const subCommand = args.shift()?.toLowerCase(); // Ambil kata pertama sebagai subcommand
    const query = args.join(' '); // Sisa kata sebagai query

    // --- LOGIKA UTAMA ---
    const userArr = findUser(sender);
    if (!userArr) {
        return sock.sendMessage(remoteJid, { text: "Anda belum terdaftar di database. Silakan daftar terlebih dahulu." }, { quoted: message });
    }
    const [userId, userData] = userArr;

    try {
        // Jika tidak ada subcommand (hanya .pd), tampilkan profil
        if (!subCommand) {
            const pd = userData.rl?.pd;
            if (!pd) {
                // Tampilkan menu bantuan jika belum punya pasangan
                const helpText = `Anda belum memiliki pasangan.\n\n*Cara bermain:*\n1. Cari karakter: \`.pd cari <nama>\`\n2. Klaim karakter: \`.pd claim <nama>\`\n\n*Perintah Lainnya:*\n- \`.pd putus\`: Putus dengan pasangan.\n- \`.pd makan\`: Memberi makan pasangan.\n- \`.pd kerja\`: Pasangan bekerja cari uang.\n- \`.pd sogok\`: Beri hadiah untuk naikin hubungan.\n- \`.pd seks\`: Berhubungan intim.\n- \`.pd hamil\`: Cek & percepat kehamilan.`;
                return sock.sendMessage(remoteJid, { text: helpText }, { quoted: message });
            }

            // Tampilkan profil pasangan
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
            
            await sock.sendMessage(remoteJid, { image: { url: pd.img }, caption: profileText }, { quoted: message });
            return; // Selesai
        }

        // Gunakan switch untuk subcommand yang ada
        switch (subCommand) {
            case 'cari':
                if (!query) return sock.sendMessage(remoteJid, { text: "Masukkan nama karakter yang ingin dicari. Contoh: `.pd cari Naruto`" }, { quoted: message });
                
                const char = await searchCharacter(query);
                if (!char) return sock.sendMessage(remoteJid, { text: `Karakter dengan nama "${query}" tidak ditemukan.` }, { quoted: message });
                
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
                
                await sock.sendMessage(remoteJid, { image: { url: char.image_url }, caption: searchResult }, { quoted: message });
                break;

            case 'claim':
                if (userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Anda sudah memiliki pasangan. Ketik `.pd putus` terlebih dahulu." }, { quoted: message });
                if (!query) return sock.sendMessage(remoteJid, { text: "Masukkan nama karakter yang ingin diklaim." }, { quoted: message });

                const charToClaim = await searchCharacter(query);
                if (!charToClaim) return sock.sendMessage(remoteJid, { text: `Karakter "${query}" tidak ditemukan.` }, { quoted: message });
                
                const claimant = getClaimantInfo(charToClaim.mal_id);
                if (claimant) {
                     const claimantUser = findUser(claimant);
                     const claimantUsername = claimantUser ? claimantUser[1].username : "Seseorang";
                     return sock.sendMessage(remoteJid, { text: `Maaf, ${charToClaim.name} sudah diklaim oleh *${claimantUsername}*.` }, { quoted: message });
                }
                
                claimCharacter(charToClaim.mal_id, sender); // Simpan JID user sebagai claimant
                const newPartnerData = {
                    nama: charToClaim.name,
                    gender: 'Tergantung Karakter',
                    status: 'Pacaran',
                    umurpd: new Date().toISOString(),
                    hubungan: 50,
                    level: 1, xp: 0, food: 100, uang: 1000,
                    img: charToClaim.image_url,
                    mal_id: charToClaim.mal_id,
                    mal_url: charToClaim.url,
                    anak: [],
                    kehamilan: false,
                    trimester: 0,
                    horny: 0
                };

                updateUser(sender, { rl: { pd: newPartnerData } });
                await sock.sendMessage(remoteJid, { text: `Selamat! Anda sekarang resmi berpacaran dengan *${charToClaim.name}*.` }, { quoted: message });
                break;

            case 'putus':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Anda tidak memiliki pasangan untuk diputuskan." }, { quoted: message });
                
                const partnerToRelease = userData.rl.pd;
                releaseCharacter(partnerToRelease.mal_id);
                
                // Hapus data pasangan dari user
                const updatedUser = { ...userData };
                delete updatedUser.rl.pd;
                updateUser(sender, updatedUser);

                await sock.sendMessage(remoteJid, { text: `Anda telah putus dengan *${partnerToRelease.nama}*.` }, { quoted: message });
                break;

            case 'seks':
                {
                    if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                    const pd = userData.rl.pd;
                    if (pd.food < 20) return sock.sendMessage(remoteJid, { text: `${pd.nama} lapar! Beri makan dulu dengan .pd makan.` }, { quoted: message });
                    
                    let scene = `${pd.nama} meraih tanganmu dengan wajah memerah. Tubuhnya bergetar, nafasnya berat ketika kau menariknya lebih dekat. Malam itu kalian tenggelam dalam gairah panas... 💦`;
                    
                    pd.horny = Math.min((pd.horny || 0) + 50, 100);
                    pd.food -= 10;
                    pd.xp += 20;
                    pd.hubungan = Math.min((pd.hubungan || 50) + 5, 100);

                    if (pd.xp >= 100) {
                        pd.level += 1;
                        pd.xp %= 100;
                        scene += `\n\nHubungan kalian semakin dalam, level pasanganmu naik ke *Level ${pd.level}*! 🎉`;
                    }

                    if (Math.random() < 0.3 && !pd.kehamilan) {
                        pd.kehamilan = true;
                        pd.trimester = 1;
                        scene += `\n\nBeberapa minggu kemudian, ${pd.nama} merasa mual... sepertinya ada kehidupan baru yang tumbuh 🤰.`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: scene }, { quoted: message });
                }
                break;

            case 'hamil':
                {
                    if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                    const pd = userData.rl.pd;
                    if (!pd.kehamilan) return sock.sendMessage(remoteJid, { text: `${pd.nama} belum hamil.` }, { quoted: message });

                    pd.trimester++;
                    let info = `${pd.nama} kini memasuki trimester ${pd.trimester}. Perutnya mulai membuncit lembut. 👶`;

                    if (pd.trimester >= 3) {
                        const genderAnak = Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan';
                        const anakBaru = { nama: `Anak-${pd.anak.length + 1}`, gender: genderAnak };
                        pd.anak.push(anakBaru);
                        pd.kehamilan = false;
                        pd.trimester = 0;
                        info = `*Selamat!* ${pd.nama} melahirkan seorang bayi ${genderAnak} yang mungil! 👶✨`;
                    }
                    
                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: info }, { quoted: message });
                }
                break;

            case 'sogok':
                 {
                    if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                    const pd = userData.rl.pd;
                    if (pd.uang < 500) return sock.sendMessage(remoteJid, { text: "Uang pasanganmu kurang untuk disogok." }, { quoted: message });

                    pd.uang -= 500;
                    pd.hubungan = Math.min((pd.hubungan || 50) + 10, 100);
                    const teks = `Kamu memberi hadiah mahal pada ${pd.nama}. Wajahnya langsung berseri, hubungan kalian naik menjadi ${pd.hubungan}! 💝`;

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
                }
                break;
            
            case 'makan':
                {
                     if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                     const pd = userData.rl.pd;
                     if(pd.food >= 100) return sock.sendMessage(remoteJid, {text: `${pd.nama} sudah kenyang!`}, {quoted: message})
                     
                     pd.food = Math.min(pd.food + 25, 100);
                     pd.hubungan = Math.min((pd.hubungan || 50) + 2, 100);

                     updateUser(sender, { rl: { pd } });
                     await sock.sendMessage(remoteJid, { text: `Kamu memberi makan ${pd.nama}. Food naik jadi ${pd.food}!`}, { quoted: message });
                }
                break;

            case 'kerja':
                {
                    if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                    const pd = userData.rl.pd;
                    if(pd.food < 15) return sock.sendMessage(remoteJid, {text: `${pd.nama} terlalu lapar untuk bekerja!`}, {quoted: message})

                    const earned = Math.floor(Math.random() * 500) + 500;
                    pd.uang += earned;
                    pd.food -= 15;

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: `${pd.nama} bekerja keras dan dapat Rp${earned.toLocaleString('id-ID')}! 💼` }, { quoted: message });
                }
                break;


            default:
                await sock.sendMessage(remoteJid, { text: `Perintah \`.pd ${subCommand}\` tidak ditemukan. Ketik \`.pd\` untuk melihat daftar perintah.` }, { quoted: message });
                break;
        }
    } catch (error) {
        console.error("Terjadi error pada perintah .pd:", error);
        await sock.sendMessage(remoteJid, { text: "Maaf, terjadi kesalahan pada sistem." }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["pd", "pasangan"],
    OnlyPremium: false,
    OnlyOwner: false
};
