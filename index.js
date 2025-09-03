console.log(`[✔] Start App ...`);

// Memerlukan Node.js versi 20 atau lebih tinggi
const [major] = process.versions.node.split(".").map(Number);

if (major < 20) {
  console.error(`❌ Script ini memerlukan Node.js versi 20.x atau lebih tinggi.`);
  console.error(
    `ℹ️  Versi Node.js Anda saat ini adalah ${process.version}. Silakan perbarui.`
  );

  // Tunggu 60 detik sebelum keluar
  setTimeout(() => {
    process.exit(1);
  }, 60_000);
  return;
}

process.env.TZ = "Asia/Jakarta"; // Lokasi Timezone utama
require("module-alias/register");
require("@lib/version");

const { checkAndInstallModules } = require("@lib/utils");
const config = require("@config");
const axios = require("axios");

(async () => {
  try {
    // Cek dan install semua module yang diperlukan
    await checkAndInstallModules([
      "wa-sticker-formatter",
      "follow-redirects",
      "qrcode-reader",
      "jimp",
      "baileys",
      "api-autoresbot",
    ]);

    const { start_app } = require("@lib/startup");
    await start_app();
  } catch (err) {
    console.error("Error dalam proses start_app:", err.message); // <-- Perbaikan typo di sini
    await reportCrash("inactive");
    process.exit(1);
  }
})();

const BOT_NUMBER = config.phone_number_bot || "";
async function reportCrash(status) {
  // const reportUrl = `https://example.com/api/${BOT_NUMBER}/status?status=${encodeURIComponent(status)}`;
  // try {
  //   await axios.get(reportUrl);
  //   console.log('✅ Laporan crash berhasil dikirim.');
  // } catch (err) {
  //   console.error('❌ Gagal kirim laporan crash:', err.message);
  // }
}

// ─── Error Handler ───────────────────────────────────────
process.on("uncaughtException", async (err) => {
  console.error("❌ Uncaught Exception:", err);
  await reportCrash("inactive");
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  await reportCrash("inactive");
  process.exit(1);
});
