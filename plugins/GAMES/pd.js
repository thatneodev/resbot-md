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
                    //gender: 'Tergantung Karakter', // Anda bisa perbaiki ini jika API menyediakan gender
                    status: 'Pacaran',
                    umurpd: new Date().toISOString(),
                    hubungan: 50,
                    level: 1, xp: 0, food: 100, uang: 1000,
                    img: charToClaim.image_url,
                    mal_id: charToClaim.mal_id,
                    mal_url: charToClaim.url,
                    anak: []
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

            default: // Menampilkan profil pasangan jika .pd saja
                const pd = userData.rl?.pd;
                if (!pd) {
                    return sock.sendMessage(remoteJid, { text: "Anda belum memiliki pasangan.\nKetik `.pd cari <nama>` untuk mencari pasangan." }, { quoted: message });
                }

                const relationshipDays = msToDays(Date.now() - new Date(pd.umurpd).getTime());
                let profileText = `💖 *Profil Pasanganmu* 💖\n\n`;
                profileText += `👤 *Nama:* ${pd.nama}\n`;
                profileText += `❤️ *Status:* ${pd.status} (selama ${relationshipDays} hari)\n\n`;
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
