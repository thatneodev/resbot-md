const fs = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
const path = './database/list.json'; // Lokasi file JSON
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');
const { logWithTime }  = require('@lib/utils');

// Mengecek apakah file ada
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Membaca data dari file JSON
async function readList() {
    try {
        let currentList;
        const cachedData = getCache(`list-group`);
        if (cachedData) {
            currentList = cachedData.data; // Menggunakan data dari cache
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8'); // Buat file jika belum ada
            }
            const data = await fs.readFile(path, 'utf8');
            currentList = JSON.parse(data);
            setCache(`list-group`, currentList);
        }
        return currentList;
        
    } catch (error) {
        console.error('Error reading list file:', error);
        throw error;
    }
}

async function getDataByGroupId(groupId) {
    try {
      
        const parsedData = await readList();

        // Ambil data berdasarkan groupId
        if (parsedData[groupId]) {
            return parsedData[groupId];
        } else {
            return null; // Atau kembalikan nilai default
        }
    } catch (error) {
        console.error('Error membaca data grup:', error);
        throw error;
    }
}



// Menyimpan data ke file JSON
async function saveList(data) {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        deleteCache('list-group');
        logWithTime('DELETE CACHE FILE', `list.json`, 'merah');
    } catch (error) {
        console.error('Error saving list file:', error);
        throw error;
    }
}

// Menambahkan keyword baru atau memperbarui data keyword
async function addList(id_grub, keyword, content) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) {
            // Grup belum ada, tambahkan baru
            groups[id_grub] = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                list: {}
            };
        }

        // Validasi apakah keyword sudah ada
        if (groups[id_grub].list[keyword]) {
            return { success: false, message: `Keyword "${keyword}" already exists.` };
        }

        // Tambahkan keyword dan content ke dalam grup
        groups[id_grub].list[keyword] = {
            content,
            addedAt: new Date().toISOString()
        };

        // Perbarui waktu terakhir diubah
        groups[id_grub].updatedAt = new Date().toISOString();

        await saveList(groups);
        return { success: true, message: 'Keyword added successfully.' };
    } catch (error) {
        console.error('Error adding to list:', error);
        return { success: false, message: 'Error adding to list.' };
    }
}


// Memperbarui keyword jika sudah ada, atau menambah keyword baru
async function updateList(id_grub, keyword, content) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) {
            // Grup belum ada, tambahkan baru
            groups[id_grub] = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                list: {}
            };
        }

        // Periksa apakah keyword sudah ada
        if (groups[id_grub].list[keyword]) {
            // Update content untuk keyword yang ada
            groups[id_grub].list[keyword] = {
                content,
                updatedAt: new Date().toISOString() // Tambahkan waktu pembaruan
            };
        } else {
            return { success: false, message: `Keyword "${keyword}" tidak ditemukan!` };
        }

        // Perbarui waktu terakhir diubah untuk grup
        groups[id_grub].updatedAt = new Date().toISOString();

        await saveList(groups);
        return { success: true, message: `Keyword "${keyword}" processed successfully.` };
    } catch (error) {
        console.error('Error updating list:', error);
        return { success: false, message: 'Error updating list.' };
    }
}

async function updateKeyword(id_grub, oldKeyword, newKeyword) {
    try {
        const groups = await readList();

        // Periksa apakah grup ada
        if (!groups[id_grub]) {
            return { success: false, message: `Group with ID "${id_grub}" does not exist.` };
        }

        // Periksa apakah keyword lama ada
        if (!groups[id_grub].list[oldKeyword]) {
            return { success: false, message: `Keyword "${oldKeyword}" tidak ditemukan` };
        }

        // Periksa apakah keyword baru sudah ada
        if (groups[id_grub].list[newKeyword]) {
            return { success: false, message: `Keyword "${newKeyword}" sudah digunakan.` };
        }

        // Salin konten dari keyword lama ke keyword baru
        groups[id_grub].list[newKeyword] = { 
            ...groups[id_grub].list[oldKeyword], 
            updatedAt: new Date().toISOString() 
        };

        // Hapus keyword lama
        delete groups[id_grub].list[oldKeyword];

        // Perbarui waktu terakhir diubah grup
        groups[id_grub].updatedAt = new Date().toISOString();

        // Simpan perubahan ke file
        await saveList(groups);
        return { success: true, message: 'Keyword berhasil di perbarui' };
    } catch (error) {
        return { success: false, message: 'Error memperbarui keyword' };
    }
}


// Menghapus keyword berdasarkan id_grub dan keyword
async function deleteList(id_grub, keyword) {
    try {
        const groups = await readList();

        // Validasi apakah grup ada
        if (!groups[id_grub]) {
            return { success: false, message: `Group "${id_grub}" does not exist.` };
        }

        // Validasi apakah keyword ada dalam grup
        if (!groups[id_grub].list[keyword]) {
            return { success: false, message: `Keyword "${keyword}" does not exist in group "${id_grub}".` };
        }

        
       // cek file
       const media = groups[id_grub].list[keyword].content.media;
       if (media) {
            // Hapus media
            const filePath = `./database/media/${media}`;
            try {
                await fs.unlink(filePath); // Hapus file
            } catch (error) {
                if (error.code === 'ENOENT') {
                    console.log(`File ${media} tidak ditemukan.`);
                } else {
                    console.error(`Gagal menghapus file ${media}:`, error);
                }
            }
        }
    
        // Hapus keyword dari grup
        delete groups[id_grub].list[keyword];

        // Perbarui waktu terakhir diubah
        groups[id_grub].updatedAt = new Date().toISOString();
        
        // Simpan perubahan
        await saveList(groups);
        return { success: true, message: `Keyword "${keyword}" deleted successfully.` };
    } catch (error) {
        console.error('Error deleting from list:', error);
        return { success: false, message: 'Error deleting from list.' };
    }
}


// Ekspor fungsi
module.exports = {
    readList,
    addList,
    getDataByGroupId,
    deleteList,
    updateKeyword,
    updateList
};
