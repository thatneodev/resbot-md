/*
⚠️ PERINGATAN:
Script ini **TIDAK BOLEH DIPERJUALBELIKAN** dalam bentuk apa pun!

╔══════════════════════════════════════════════╗
║                🛠️ INFORMASI SCRIPT           ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 4.1.7
║ 👨‍💻 Developer  : Azhari Creative              ║
║ 🌐 Website    : https://autoresbot.com       ║
║ 💻 GitHub     : github.com/autoresbot/resbot ║
╚══════════════════════════════════════════════╝

📌 Mulai 11 April 2025,
Script **Autoresbot** resmi menjadi **Open Source** dan dapat digunakan secara gratis:
🔗 https://autoresbot.com
*/

console.log(`[✔] Start App ...`);

process.env.TZ = 'Asia/Jakarta'; // Lokasi Timezone utama
require('module-alias/register');
require('@lib/version');
const { checkAndInstallModules }  = require('@lib/utils');
const updateWAProto               = require('@lib/update-proto');

(async () => {
    try {
        await updateWAProto();
        console.log(`[✔] WAProto update selesai!`);

        // Cek dan install semua module yang diperlukan
        await checkAndInstallModules([
            'wa-sticker-formatter',
            'follow-redirects',
            'qrcode-reader',
            'jimp'
        ]);

        const { start_app } = require('@lib/startup');
        await start_app();
    } catch (err) {
        console.error('Error dalam proses start_app:', err.message);
    }
})();



