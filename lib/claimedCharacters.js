const fsp = require("fs").promises;
const { findUser } = require('./users'); // Impor findUser untuk mendapatkan nama
const claimedCharsJson = "./database/claimed_characters.json";

let claimedDb = {}; // { "mal_id": "user_uuid" }

// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Load database
async function loadClaimedCharacters() {
    try {
        if (!(await fileExists(claimedCharsJson))) {
            await fsp.writeFile(claimedCharsJson, JSON.stringify({}, null, 2), "utf8");
        }
        const data = await fsp.readFile(claimedCharsJson, "utf8");
        claimedDb = JSON.parse(data);
    } catch (error) {
        console.error("❌ Error loading claimed characters file:", error);
        claimedDb = {};
    }
}

// Simpan database
async function saveClaimedCharacters() {
    try {
        await fsp.writeFile(claimedCharsJson, JSON.stringify(claimedDb, null, 2), "utf8");
    } catch (error) {
        console.error("❌ Error saving claimed characters file:", error);
    }
}

/**
 * Mendapatkan informasi siapa yang mengklaim karakter.
 * @param {number} characterId MAL ID dari karakter.
 * @returns {string|null} Nama pengguna yang mengklaim atau null.
 */
function getClaimantInfo(characterId) {
    const userId = claimedDb[characterId];
    if (!userId) return null;
    
    const userArr = findUser(userId);
    return userArr ? userArr[1].username : "Pengguna Tidak Dikenal";
}

/**
 * Mengklaim karakter untuk pengguna.
 * @param {number} characterId MAL ID dari karakter.
 * @param {string} userId UUID dari pengguna.
 * @returns {boolean} True jika berhasil, false jika sudah diklaim.
 */
function claimCharacter(characterId, userId) {
    if (claimedDb[characterId]) {
        return false; 
    }
    claimedDb[characterId] = userId;
    saveClaimedCharacters();
    return true;
}

/**
 * Melepaskan klaim pada karakter.
 * @param {number} characterId MAL ID dari karakter.
 * @returns {boolean} True jika berhasil dilepaskan.
 */
function releaseCharacter(characterId) {
    if (claimedDb[characterId]) {
        delete claimedDb[characterId];
        saveClaimedCharacters();
        return true;
    }
    return false;
}

// Load data saat aplikasi pertama kali berjalan
loadClaimedCharacters();

// Simpan secara berkala
setInterval(saveClaimedCharacters, 60 * 1000);

module.exports = {
    getClaimantInfo,
    claimCharacter,
    releaseCharacter,
};
