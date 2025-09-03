const { findUser, updateUser } = require('../../lib/users');
const { searchCharacter } = require('../../lib/jikan');
const { getClaimantInfo, claimCharacter, releaseCharacter } = require('../../lib/claimedCharacters');

const msToDays = (ms) => Math.floor(ms / (1000 * 60 * 60 * 24));

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, text } = messageInfo;
    const args = text.split(' ').slice(1);
    const subCommand = args[0]?.toLowerCase();
    const query = args.slice(1).join(' ');

    const userArr = findUser(sender);
    if (!userArr) {
        return sock.sendMessage(remoteJid, { text: "Anda belum terdaftar di database. Silakan daftar terlebih dahulu." }, { quoted: message });
    }
    const [userId, userData] = userArr;

    try {
        switch (subCommand) {
            case 'cari':
                if (!query) return sock.sendMessage(remoteJid, { text: "Masukkan nama karakter yang ingin dicari. Contoh: `.pd cari Naruto`" }, { quoted: message });
                
                const char = await searchCharacter(query);
                if (!char) return sock.sendMessage(remoteJid, { text: `Karakter dengan nama "${query}" tidak ditemukan.` }, { quoted: message });
                
                const claimantName = getClaimantInfo(char.mal_id);
                
                let statusText = `✅ *Status:* Tersedia`;
                let claimSuggestion = `\n\nKetik \`.pd claim ${char.name}\` untuk menjadikan karakter ini pasanganmu!`;

                if (claimantName) {
                    statusText = `❌ *Status:* Sudah diklaim oleh *${claimantName}*`;
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
                if (claimant) return sock.sendMessage(remoteJid, { text: `Maaf, ${charToClaim.name} sudah diklaim oleh *${claimant}*.` }, { quoted: message });

                claimCharacter(charToClaim.mal_id, userId);
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
                
                updateUser(sender, { rl: { pd: null } });
                await sock.sendMessage(remoteJid, { text: `Anda telah putus dengan *${partnerToRelease.nama}*.` }, { quoted: message });
                break;

            // ====== FITUR BARU ======
            case 'seks':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    const scene = `${pd.nama} meraih tanganmu dengan wajah memerah. Tubuhnya bergetar, nafasnya berat ketika kau menariknya lebih dekat. Malam itu kalian tenggelam dalam gairah panas, desahan dan rintihan memenuhi udara... 💦`;
                    
                    pd.horny = (pd.horny || 0) + 50;

                    // ada chance hamil
                    if (Math.random() < 0.3 && !pd.kehamilan) {
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

                    pd.trimester++;
                    let info = `${pd.nama} kini memasuki trimester ${pd.trimester}. Perutnya mulai membuncit lembut, setiap hari terasa semakin dekat dengan kelahiran. 👶`;

                    if (pd.trimester >= 3) {
                        const anakBaru = { nama: `Anak-${pd.anak.length + 1}`, umur: 0 };
                        pd.anak.push(anakBaru);
                        pd.kehamilan = false;
                        pd.trimester = 0;
                        info = `${pd.nama} melahirkan seorang bayi mungil! 👶✨ Anakmu kini ada di daftar keluarga.`;
                    }

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: info }, { quoted: message });
                }
                break;

            case 'sogok':
                if (!userData.rl?.pd) return sock.sendMessage(remoteJid, { text: "Kamu belum punya pasangan." }, { quoted: message });
                {
                    const pd = userData.rl.pd;
                    if (pd.uang < 500) return sock.sendMessage(remoteJid, { text: "Uangmu kurang untuk nyogok pasangan." }, { quoted: message });

                    pd.uang -= 500;
                    pd.hubungan += 10;
                    const teks = `Kamu memberi hadiah mahal pada ${pd.nama}. Wajahnya langsung berseri, hubunganmu naik jadi ${pd.hubungan}! 💝`;

                    updateUser(sender, { rl: { pd } });
                    await sock.sendMessage(remoteJid, { text: teks }, { quoted: message });
                }
                break;

            default:
                const pd = userData.rl?.pd;
                if (!pd) {
                    return sock.sendMessage(remoteJid, { text: "Anda belum memiliki pasangan.\nKetik `.pd cari <nama>` untuk mencari pasangan." }, { quoted: message });
                }

                const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
                let profileText = `💖 *Profil Pasanganmu* 💖\n\n`;
                profileText += `👤 *Nama:* ${pd.nama}\n`;
                profileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n`;
                profileText += `💰 *Uang:* ${pd.uang}\n`;
                profileText += `🔥 *Horny:* ${pd.horny}\n`;
                profileText += `🤰 *Kehamilan:* ${pd.kehamilan ? `Trimester ${pd.trimester}` : 'Tidak'}\n`;
                profileText += `👶 *Anak:* ${pd.anak.length} anak\n\n`;
                profileText += `🔗 *Info Karakter:* ${pd.mal_url || 'Tidak ada'}`;
                
                await sock.sendMessage(remoteJid, { image: { url: pd.img }, caption: profileText }, { quoted: message });
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
