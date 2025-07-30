const config    = require('@config');
const fsp       = require("fs").promises;
const usersJson = "./database/users.json";
const ownerJson = "./database/owner.json";

let savingQueueUsers = Promise.resolve(); // Queue untuk penyimpanan users
let savingQueueOwners = Promise.resolve(); // Queue untuk penyimpanan owners

const AUTOSAVE  = 60; // 60 Detik

const MS_IN_A_DAY = 24 * 60 * 60 * 1000; // Konstanta untuk 1 hari dalam milidetik

let db = {}; // Database pengguna di memori
let dbOwner = []; // Database owner di memori

// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Load users.json ke dalam memori
async function loadUsers() {
    try {
        if (!(await fileExists(usersJson))) {
            await fsp.writeFile(usersJson, JSON.stringify({}, null, 2), "utf8");
        }

        const data = await fsp.readFile(usersJson, "utf8");
        db = JSON.parse(data);
    } catch (error) {
        console.error("❌ Error loading users file:", error);
        db = {};
    }
}

async function resetMoney() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
        db[userId].money = 0;
        db[userId].updatedAt = new Date().toISOString();
        }
    }
}

function resetMemberOld() {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    for (const userId in db) {
        if (!db.hasOwnProperty(userId)) continue;

        const user = db[userId];
        const lastUpdate = new Date(user.updatedAt).getTime();
        

        if (now - lastUpdate > THIRTY_DAYS_MS) {
            delete db[userId];
            deletedCount++;
        }
    }

}




async function resetLimit() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
        db[userId].limit = 0;
        db[userId].updatedAt = new Date().toISOString();
        }
    }
}


async function resetLevel() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
        db[userId].level = 0;
        db[userId].updatedAt = new Date().toISOString();
        }
    }
}



async function resetUsers() {
    db = {}; // Reset database di memori
    await saveUsers();
}

async function resetOwners() {
    dbOwner = []; // Reset database owner di memori
    await saveOwners();
}

// Load owner.json ke dalam memori
async function loadOwners() {
    try {
        if (!(await fileExists(ownerJson))) {
            await fsp.writeFile(ownerJson, JSON.stringify([], null, 2), "utf8");
        }

        const data = await fsp.readFile(ownerJson, "utf8");
        dbOwner = JSON.parse(data);

        if (!Array.isArray(dbOwner)) {
            throw new Error("Format owner.json tidak sesuai (harus berupa array).");
        }
    } catch (error) {
        console.error("❌ Error loading owner file:", error);
        dbOwner = [];
    }
}

// Fungsi menyimpan database users dari memori ke file
async function saveUsers() {
    savingQueueUsers = savingQueueUsers.then(async () => {
        try {
            await fsp.writeFile(usersJson, JSON.stringify(db, null, 2), "utf8");
        } catch (error) {
            console.error("❌ Error saving users file:", error);
        }
    });
}

// Fungsi menyimpan database owners dari memori ke file
async function saveOwners() {
    savingQueueOwners = savingQueueOwners.then(async () => {
        try {
            await fsp.writeFile(ownerJson, JSON.stringify(dbOwner, null, 2), "utf8");
        } catch (error) {
            console.error("❌ Error saving owners file:", error);
        }
    });
}

// Fungsi membaca users dari memori
async function readUsers() {
    return db;
}

// Fungsi menambahkan user ke memori
function addUser(id, userData) {
    if (db[id]) return false;

    db[id] = {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return true;
}

// Memperbarui data pengguna
function updateUser(id, updateData) {
    if (!db[id]) return false;

    if (updateData.money !== undefined) {
        updateData.money = Math.max(0, updateData.money);
    }
    if (updateData.limit !== undefined) {
        updateData.limit = Math.max(0, updateData.limit);
    }

    db[id] = {
        ...db[id],
        ...updateData,
        updatedAt: new Date().toISOString(),
    };
    return true;
}

// Menghapus pengguna
function deleteUser(id) {
    if (!db[id]) return false;
    delete db[id];
    return true;
}

// Mencari pengguna berdasarkan ID
function findUser(id) {
    return db[id] || null;
}

// Cek apakah user premium
function isPremiumUser(remoteJid) {
    const data = findUser(remoteJid);
    if (!data || !data.premium) return false;

    const premiumDate = new Date(data.premium);
    return !isNaN(premiumDate) && premiumDate > new Date();
}

// Mendapatkan daftar pengguna tidak aktif selama lebih dari 7 hari
function getInactiveUsers() {
    const sevenDaysAgo = Date.now() - 7 * MS_IN_A_DAY;

    return Object.entries(db)
        .filter(([_, userData]) => {
            if (!userData.updatedAt) return false;
            return new Date(userData.updatedAt).getTime() < sevenDaysAgo;
        })
        .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

// Mendapatkan daftar pengguna yang masih aktif dalam 7 hari terakhir

function getActiveUsers(TOTAL_HARI_SIDER) {
    const sevenDaysAgo = Date.now() - TOTAL_HARI_SIDER * MS_IN_A_DAY;

    return Object.entries(db)
        .filter(([_, userData]) => {
            if (!userData.updatedAt) return false;
            return new Date(userData.updatedAt).getTime() >= sevenDaysAgo;
        })
        .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

// ====== Fungsi Owner ======
// Cek apakah nomor adalah owner
// function isOwner(remoteJid) {
//     const ownerJids = config.owner_number.map((number) => `${number}@s.whatsapp.net`);
//     const dbOwnerJids = dbOwner.map((number) => `${number}@s.whatsapp.net`); // Tambahkan @s.whatsapp.net

//     return [...ownerJids, ...dbOwnerJids].includes(remoteJid);
// }
function generateAllOwnerIds() {
  const rawIds = [
    ...(config.owner_number || []),
    ...(dbOwner || [])
  ];

  const allIds = new Set();

  for (const raw of rawIds) {
    let base = raw;

    if (raw.includes('@')) {
      // Sudah lengkap, ambil sebelum @
      base = raw.split('@')[0];
      // Jaga-jaga: juga tambahkan original
      allIds.add(raw);
    }

    // Tambahkan dua bentuk:
    allIds.add(`${base}@s.whatsapp.net`);
    allIds.add(`${base}@lid`);
  }

  return Array.from(allIds);
}

function isOwner(remoteJid) {
  const ownerIds = generateAllOwnerIds();
  return ownerIds.includes(remoteJid);
}



// List semua owner
function listOwner() {
    const ownerJids = config.owner_number.map((number) => `${number}@s.whatsapp.net`);
    return [...ownerJids, ...dbOwner];
}

// Tambahkan owner baru
function addOwner(number) {
    if (!dbOwner.includes(number)) {
        dbOwner.push(number);
        return true;
    }
    return false;
}

// Hapus owner
function delOwner(number) {
    const index = dbOwner.indexOf(number);
    if (index !== -1) {
        dbOwner.splice(index, 1);
        return true;
    }
    return false;
}

// Save database setiap 1 menit
setInterval(saveUsers, AUTOSAVE * 1000);
setInterval(saveOwners, AUTOSAVE * 1000);

// Load data pertama kali
loadUsers();
loadOwners();

// Ekspor fungsi
module.exports = {
    readUsers,
    addUser,
    updateUser,
    deleteUser,
    findUser,
    getInactiveUsers,
    getActiveUsers,
    isPremiumUser,
    isOwner,
    listOwner,
    addOwner,
    delOwner,
    saveUsers,
    saveOwners,
    resetUsers,
    resetOwners,
    resetMoney,
    resetLimit,
    resetLevel,
    resetMemberOld,
    db, // Ekspor database jika dibutuhkan di file lain
    dbOwner, // Ekspor database owner jika dibutuhkan
};
