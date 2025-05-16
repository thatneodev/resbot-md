const { reply } = require('@lib/utils');
const config = require('@config');
const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { m } = messageInfo;
    let baileysVersion = 'Tidak ditemukan';

    try {
        const pkgPath = require.resolve('baileys/package.json');
        const pkgData = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgData);

        baileysVersion = pkg.version;
    } catch (error) {
        console.warn('[!] Gagal membaca versi Baileys:', error.message);
    }

    const responseText = [
        `◧ ᴠᴇʀꜱɪ ꜱᴄ : ${config.version}`,
        `◧ ʙᴀɪʟᴇʏꜱ   : v${baileysVersion}`
    ].join('\n');

    await reply(m, responseText);
}

module.exports = {
    handle,
    Commands: ['version', 'versi'],
    OnlyPremium: false,
    OnlyOwner: false
};
