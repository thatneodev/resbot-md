const { findUser, updateUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');

const msToDays = (ms) => Math.floor(ms / (1000 * 60 * 60 * 24));

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, text } = messageInfo;
    
    // Perbaikan parsing argumen: Handle jika text undefined atau null
    const safeText = text || '';
    
    // Asumsikan prefix dan command
    const prefix = '.'; // Sesuaikan jika prefix berbeda
    const command = 'pd'; // Atau 'pasangan'
    let argsText = safeText.trim().startsWith(prefix + command) ? safeText.trim().slice(prefix.length + command.length).trim() : '';
    const args = argsText.split(/ +/);
    const subCommand = args[0] ? args[0].toLowerCase() : null;
    const query = args.slice(1).join(' ');

    const userArr = findUser(sender);
    if (!userArr) {
        return sock.sendMessage(remoteJid, { text: "Anda belum terdaftar di database. Silakan daftar terlebih dahulu." }, { quoted: message });
    }
    const [userId, userData] = userArr;

    try {
        if (subCommand === null) {
            // Default: Tampilkan profil jika ada pasangan, atau instruksi
            const pd = userData.rl?.pd;
            if (!pd) {
                return sock.sendMessage(remoteJid, { text: "Anda belum memiliki pasangan.\nKetik `.pd cari <nama>` untuk mencari pasangan.\n\nDaftar perintah:\n- cari <nama>: Cari karakter\n- claim <nama>: Klaim karakter\n- putus: Putus dengan pasangan\n- seks: Berhubungan intim\n- hamil: Periksa/percepat kehamilan\n- sogok: Beri hadiah\n- makan: Beri makan pasangan\n- kerja: Pasangan bekerja dapat uang\n- profil: Tampilkan profil (default)" }, { quoted: message });
            }

            const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
            let profileText = `💖 *Profil Pasanganmu* 💖\n\n`;
            profileText += `👤 *Nama:* ${pd.nama}\n`;
            profileText += `🚻 *Gender:* ${pd.gender || 'Tidak diketahui'}\n`;
            profileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n`;
            profileText += `📊 *Level:* ${pd.level} (XP: ${pd.xp}/100)\n`;
            profileText += `🍎 *Food:* ${pd.food}/100\n`;
            profileText += `💰 *Uang:* ${pd.uang}\n`;
            profileText += `🔥 *Horny:* ${pd.horny || 0}/100\n`;
            profileText += `💞 *Hubungan:* ${pd.hubungan || 50}/100\n`;
            profileText += `🤰 *Kehamilan:* ${pd.kehamilan ? `Trimester ${pd.trimester}` : 'Tidak'}\n`;
            profileText += `👶 *Anak:* ${pd.anak.length} anak\n`;
            if (pd.anak.length > 0) {
                profileText += pd.anak.map((a, i) => `  - ${a.nama} (Umur: ${a.umur} hari)`).join('\n');
            }
            profileText += `\n🔗 *Info Karakter:* ${pd.mal_url || 'Tidak ada'}`;
            
            await sock.sendMessage(remoteJid, { image: { url: pd.img }, caption: profileText }, { quoted: message });
            return;
        }

        switch (subCommand) {
            case 'cari':
                if (!query) return sock.sendMessage(remoteJid, { text: "Masukkan nama karakter yang ingin dicari. Contoh: `.pd cari Naruto`" }, { quoted: message });
                
                const char = await searchCharacter(query);
                if (!char) return sock.sendMessage(remoteJid, { text: `Karakter dengan nama "${query}" tidak ditemukan.` }, { quoted: message });
                
                const claimant = getClaimantInfo(char.mal_id);
                
                let statusText = `✅ *Status:* Tersedia`;
                let claimSuggestion = `\n\nKetik \`.pd claim ${char.name}\` untuk menjadikan karakter ini pasanganmu!`;

                if (claimant) {
                    statusText = `❌ *Status:* Sudah diklaim oleh *${claimant}*`;
                    claimSuggestion = "";
                }

                const searchResult = `*Nama:* ${char.name}\n*Deskripsi:* ${char.about || 'Tidak ada deskripsi'}\n${statusText}${claimSuggestion}`;
                
                await sock.sendMessage(remoteJid, { image: { url: char.image_url }, caption: searchResult }, { quoted: message });
                break;

            case 'claim':
                if (userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Anda sudah memiliki pasangan. Ketik `.pd putus` terlebih dahulu." }, { quoted: message });
                if (!query) return sock.sendMessage(remoteJid, { text: "Masukkan nama karakter yang ingin diklaim. Contoh: `.pd claim Naruto`" }, { quoted: message });

                const charToClaim = await searchCharacter(query);
                if (!charToClaim) return sock.sendMessage(remoteJid, { text: `Karakter "${query}" tidak ditemukan.` }, { quoted: message });
                
                const claimantClaim = getClaimantInfo(charToClaim.mal_id);
                if (claimantClaim) return sock.sendMessage(remoteJid, { text: `Maaf, ${charToClaim.name} sudah diklaim oleh *${claimantClaim}*.` }, { quoted: message });

                claimCharacter(charToClaim.mal_id, userId);
                const newPartnerData = {
                    nama: charToClaim.name,
                    gender: charToClaim.gender || 'Tidak diketahui', // Tambahkan gender jika tersedia dari API
                    status: 'Pacaran',
                    umurpd: new Date().toISOString(),
                    hubungan: 50,
                    level: 1,
                    xp: 0,
                    food: 100,
                    uang: 1000,
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
                
                updateUser(sender, { rl: { pd: null } });
                await sock.sendMessage(remoteJid, { text: `Anda telah putus dengan *${partnerToRelease.nama}*. Semua progress hilang.` }, { quoted: message });
                break;

            case 'seks':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (pd.horny >= 100) return sock.sendMessage(remoteJid, { text: `${pd.nama} sudah terlalu horny! Tunggu cooldown.` }, { quoted: message });
                    if (pd.food < 20) return sock.sendMessage(remoteJid, { text: `${pd.nama} lapar! Beri makan dulu dengan .pd makan.` }, { quoted: message });

                    let scene = `${pd.nama} meraih tanganmu dengan wajah memerah. Tubuhnya bergetar, nafasnya berat ketika kau menariknya lebih dekat. Malam itu kalian tenggelam dalam gairah panas, desahan dan rintihan memenuhi udara... 💦`;
                    
                    pd.horny = Math.min((pd.horny || 0) + 50, 100);
                    pd.food -= 10;
                    pd.xp += 20;
                    pd.hubungan = Math.min((pd.hubungan || 50) + 5, 100);

                    // Level up check
                    if (pd.xp >= 100) {
                        pd.level += 1;
                        pd.xp = 0;
                        scene += `\n\n${pd.nama} level up menjadi level ${pd.level}! 🎉`;
                    }

                    if (Math.random() < 0.3 && !pd.kehamilan && pd.gender === 'Female') { // Asumsi hanya female bisa hamil
                        pd.kehamilan = true;
                        pd.trimester = 1;
                        scene += `\n\nBeberapa minggu kemudian, ${pd.nama} merasa mual... tanda kehidupan baru tumbuh di rahimnya 🤰.`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: scene }, { quoted: message });
                }
                break;

            case 'hamil':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (!pd.kehamilan) return sock.sendMessage(remoteJid, { text: `${pd.nama} belum hamil.` }, { quoted: message });

                    pd.trimester = Math.min(pd.trimester + 1, 3);
                    let info = `${pd.nama} kini memasuki trimester ${pd.trimester}. Perutnya mulai membuncit lembut, setiap hari terasa semakin dekat dengan kelahiran. 👶`;

                    if (pd.trimester >= 3) {
                        const anakBaru = { nama: `Anak-${pd.anak.length + 1}`, umur: 0 };
                        pd.anak.push(anakBaru);
                        pd.kehamilan = false;
                        pd.trimester = 0;
                        info += `\n\n${pd.nama} melahirkan seorang bayi mungil! 👶✨ Anakmu kini ada di daftar keluarga.`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: info }, { quoted: message });
                }
                break;

            case 'sogok':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (pd.uang < 500) return sock.sendMessage(remoteJid, { text: "Uang pasanganmu kurang untuk sogok. Biarkan dia kerja dulu." }, { quoted: message });

                    pd.uang -= 500;
                    pd.hubungan = Math.min((pd.hubungan || 50) + 10, 100);
                    pd.xp += 10;
                    let teks = `Kamu memberi hadiah mahal pada ${pd.nama}. Wajahnya langsung berseri, hubunganmu naik jadi ${pd.hubungan}! 💝`;

                    // Level up check
                    if (pd.xp >= 100) {
                        pd.level += 1;
                        pd.xp = 0;
                        teks += `\n\n${pd.nama} level up menjadi level ${pd.level}! 🎉`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
                }
                break;

            case 'makan':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (pd.food >= 100) return sock.sendMessage(remoteJid, { text: `${pd.nama} sudah kenyang!` }, { quoted: message });

                    pd.food = Math.min(pd.food + 20, 100);
                    pd.hubungan = Math.min((pd.hubungan || 50) + 2, 100);
                    pd.xp += 5;
                    let teks = `Kamu memberi makan ${pd.nama}. Food naik jadi ${pd.food}! 🍲 Hubungan +2.`;

                    // Level up check
                    if (pd.xp >= 100) {
                        pd.level += 1;
                        pd.xp = 0;
                        teks += `\n\n${pd.nama} level up menjadi level ${pd.level}! 🎉`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
                }
                break;

            case 'kerja':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (pd.food < 10) return sock.sendMessage(remoteJid, { text: `${pd.nama} terlalu lapar untuk bekerja! Beri makan dulu.` }, { quoted: message });

                    const earned = Math.floor(Math.random() * 500) + 500;
                    pd.uang += earned;
                    pd.food -= 10;
                    pd.xp += 15;
                    let teks = `${pd.nama} bekerja keras dan dapat ${earned} uang! 💼 Uang sekarang: ${pd.uang}.`;

                    // Level up check
                    if (pd.xp >= 100) {
                        pd.level += 1;
                        pd.xp = 0;
                        teks += `\n\n${pd.nama} level up menjadi level ${pd.level}! 🎉`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
                }
                break;

            case 'profil':
                // Redirect ke default
                await handle(sock, { ...messageInfo, text: '.pd' }); // Panggil ulang tanpa subcommand
                break;

            default:
                await sock.sendMessage(remoteJid, { text: `Subperintah "${subCommand}" tidak dikenal. Ketik `.pd` untuk info.` }, { quoted: message });
                break;
        }
    } catch (error) {
        console.error("Terjadi error pada perintah .pd:", error);
        await sock.sendMessage(remoteJid, { text: "Maaf, terjadi kesalahan pada sistem. Coba lagi nanti." }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["pd", "pasangan"],
    OnlyPremium: false,
    OnlyOwner: false
};
