const fs = require('fs');
const path = require('path');
const { https } = require('follow-redirects');

const protoFiles = ['dist/index.d.ts', 'dist/index.js', 'WAProto.proto'];
const protoUrl = 'https://raw.githubusercontent.com/Akkun3704/wa-proto/main/';
const protoDirectory = path.join(process.cwd(), 'node_modules', '@whiskeysockets', 'baileys', 'WAProto');

function fetchFile(url, filePath) {
    return new Promise((resolve) => {
        const tempFilePath = filePath + '.tmp'; // File sementara

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.warn(`⚠️ Gagal mengunduh ${url} (Status: ${res.statusCode})`);
                return resolve(false);
            }

            const fileStream = fs.createWriteStream(tempFilePath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                fs.rename(tempFilePath, filePath, (err) => { // Ganti file hanya jika sukses
                    if (err) {
                        console.warn(`⚠️ Gagal mengganti file ${filePath}`);
                        return resolve(false);
                    }
                    resolve(true);
                });
            });

            fileStream.on('error', (err) => {
                console.warn(`⚠️ Error saat menyimpan: ${filePath} - ${err.message}`);
                fs.unlink(tempFilePath, () => resolve(false)); // Hapus file sementara jika error
            });
        }).on('error', (err) => {
            console.warn(`⚠️ Error saat mengunduh: ${url} - ${err.message}`);
            resolve(false);
        });
    });
}

async function updateWAProto() {
    if (!fs.existsSync(protoDirectory)) {
        console.warn('⚠️ Folder WAProto tidak ditemukan. Pastikan Baileys sudah diinstal.');
        return;
    }

    let successCount = 0;
    for (const file of protoFiles) {
        const filePath = path.join(protoDirectory, path.basename(file));
        const success = await fetchFile(protoUrl + file, filePath);
        if (success) successCount++;
    }

    console.log(`✅ Update selesai: ${successCount}/${protoFiles.length} file berhasil diperbarui.`);
}

module.exports = updateWAProto;
