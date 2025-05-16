const { reply } = require('@lib/utils');
const config = require('@config');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    let oldVersion = 'Tidak ditemukan';
    let newVersion = 'Tidak ditemukan';
    let updateInfo = '';

    try {
        const pkgPath = require.resolve('baileys/package.json');
        const pkgData = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgData);
        oldVersion = pkg.version;
    } catch (error) {
        console.warn('[!] Gagal membaca versi lama Baileys:', error.message);
    }

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        execSync('npm install baileys', { stdio: 'ignore' });

        // Clear cache module supaya baca ulang versi terbaru
        const resolvedPath = require.resolve('baileys/package.json');
        delete require.cache[resolvedPath];

        const newPkgData = fs.readFileSync(resolvedPath, 'utf-8');
        const newPkg = JSON.parse(newPkgData);
        newVersion = newPkg.version;

        if (newVersion !== oldVersion) {
            updateInfo = `✅ *baileys* berhasil diperbarui dari v${oldVersion} ke v${newVersion}`;
        } else {
            updateInfo = `✅ *baileys* sudah versi terbaru: v${newVersion}`;
        }
    } catch (err) {
        console.error('[!] Gagal update baileys:', err.message);
        updateInfo = '❌ Terjadi kesalahan saat memperbarui *baileys*';
    }

    const responseText = [
        updateInfo
    ].join('\n');

    await reply(m, responseText);
}

module.exports = {
    handle,
    Commands: ['updatebaileys', 'updatebailey'],
    OnlyPremium: false,
    OnlyOwner: false
};
