const fs        = require('fs');
const path      = require('path');
const config    = require("@config");
const { logWithTime } = require('@lib/utils');
const mode = config.mode; // Bisa 'production' atau 'development'

const handlers = [];

// Fungsi rekursif untuk membaca semua file `.js` dari folder dan sub-folder
function loadHandlers(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            // Jika folder, lakukan rekursi
            loadHandlers(fullPath);
        } else if (file.endsWith('.js')) {
            // Jika file JavaScript, impor dan tambahkan ke handlers
            const handler = require(fullPath);
            if (typeof handler.process === 'function') {
                // Tetapkan priority default 100 jika tidak ada
                if (typeof handler.priority === 'undefined') {
                    handler.priority = 100;
                }
                handlers.push(handler);
            }
        }
    });
}

// Memuat semua file dari folder `handle` dan sub-foldernya
loadHandlers(path.join(__dirname, '../handle'));

// Urutkan handlers berdasarkan nilai `priority` (dari kecil ke besar)
handlers.sort((a, b) => a.priority - b.priority);

logWithTime('System', `Load All Handler done...`);
module.exports = {
    async preProcess(sock, messageInfo) {
        let stopProcessing = false;

        // Jalankan setiap plugin secara berurutan
        for (const handler of handlers) {
            if (stopProcessing) break;

            try {
                const result = await handler.process(sock, messageInfo);

                // Jika handler meminta untuk menghentikan pemrosesan berikutnya
                if (result === false) {
                    logWithTime('System', `Handler ${handler.name || 'anonymous'} menghentikan pemrosesan.`);
                    stopProcessing = true;
                    return false;
                }
            } catch (error) {
                console.error(`Error pada handler ${handler.name || 'anonymous'}:`, error.message);
            }
        }

        return true; // lanjut ke plugins
    },
};
