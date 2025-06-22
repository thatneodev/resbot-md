/*
⚠️ PERINGATAN:
Script ini **TIDAK BOLEH DIPERJUALBELIKAN** dalam bentuk apa pun!

╔══════════════════════════════════════════════╗
║                🛠️ INFORMASI SCRIPT           ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 4.2.2
║ 👨‍💻 Developer  : Azhari Creative              ║
║ 🌐 Website    : https://autoresbot.com       ║
║ 💻 GitHub  : github.com/autoresbot/resbot-md ║
╚══════════════════════════════════════════════╝

📌 Mulai 11 April 2025,
Script **Autoresbot** resmi menjadi **Open Source** dan dapat digunakan secara gratis:
🔗 https://autoresbot.com
*/

console.log(`[✔] Start App ...`);


// Mewajibkan untuk menggunakan versi node js 20
const [major] = process.versions.node.split('.').map(Number);

if (major < 20 || major >= 21) {
    console.error(`❌ Script ini hanya kompatibel dengan Node.js versi 20.x`);
    console.error(`ℹ️  Jika kamu menjalankan script ini melalui panel, buka menu *Startup*, lalu ubah *Docker Image* ke versi Node.js 20`);
    
  // Tunggu 60 detik sebelum keluar
  setTimeout(() => {
    process.exit(1);
  }, 60_000);
  return;
}


process.env.TZ = 'Asia/Jakarta'; // Lokasi Timezone utama
require('module-alias/register');
require('@lib/version');
const { checkAndInstallModules }  = require('@lib/utils');

(async () => {
    try {
     
        // Cek dan install semua module yang diperlukan
        await checkAndInstallModules([
            'wa-sticker-formatter',
            'follow-redirects',
            'qrcode-reader',
            'jimp',
            'baileys'
        ]);

        const { start_app } = require('@lib/startup');
        await start_app();
    } catch (err) {
        console.error('Error dalam proses start_app:', err.message);
    }
})();



