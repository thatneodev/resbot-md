// DONT EDIT
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 menit = 10 * 60 * 1000 milidetik
// DONT EDIT

class Cache {
    constructor(expirationTime) {
        this.cache = new Map();
        this.expirationTime = expirationTime; // Durasi kadaluarsa dalam milidetik
    }

    // Fungsi untuk menambah atau update data ke dalam cache
    set(id, data) {
        const timestamp = Date.now(); // Timestamp saat ini dalam milidetik
        this.cache.set(id, { data, timestamp });
    }

    // Fungsi untuk mengambil data dari cache dengan pemeriksaan kadaluarsa
    get(id) {
        const entry = this.cache.get(id);
        if (entry) {
            // Periksa apakah cache sudah lebih dari expirationTime
            const currentTime = Date.now();
            const age = currentTime - entry.timestamp;

            if (age > this.expirationTime) {
                return false; // Data sudah kadaluarsa
            }
            return entry; // Mengembalikan objek { data, timestamp }
        }
        return null; // Jika id tidak ditemukan
    }

    // Fungsi untuk menghapus data dari cache
    delete(id) {
        return this.cache.delete(id);
    }

    // Fungsi untuk mengecek apakah id ada di cache
    has(id) {
        return this.cache.has(id);
    }

    // Fungsi untuk membersihkan seluruh cache
    clear() {
        this.cache.clear();
    }

    // Fungsi untuk mendapatkan semua data dalam cache (opsional untuk debugging)
    entries() {
        return Array.from(this.cache.entries()).map(([id, value]) => ({
            id,
            data: value.data,
            timestamp: value.timestamp,
        }));
    }

    // Fungsi untuk mendapatkan semua id dalam cache
    keys() {
        return Array.from(this.cache.keys());
    }

    // Fungsi untuk mendapatkan ukuran cache
    size() {
        return this.cache.size;
    }
}

// Fungsi untuk mengecek apakah cache untuk id tertentu ada
function checkCache(id) {
    return myCache.has(id);
}

// Fungsi untuk mendapatkan cache berdasarkan id
function getCache(id) {
    return myCache.get(id);
}

// Fungsi untuk menghapus cache berdasarkan id
function deleteCache(id) {
    myCache.delete(id);
}

// Membuat instance cache dengan durasi kadaluarsa yang ditentukan
const myCache = new Cache(CACHE_EXPIRATION_TIME);

// Ekspor fungsi-fungsi agar bisa digunakan di tempat lain
module.exports = {
    checkCache,
    getCache,
    deleteCache,
    setCache: myCache.set.bind(myCache),
    clearCache: myCache.clear.bind(myCache),
    sizeCache: myCache.size.bind(myCache),
    entriesCache: myCache.entries.bind(myCache)
};
