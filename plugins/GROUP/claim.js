const { findUser, updateUser, addUser } = require("@lib/users");
const { formatRemainingTime } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    const CLAIM_COOLDOWN_MINUTES = 120; // 120 atau 2 jam
    const MIN_CLAIM = 1;
    const MAX_CLAIM = 10;

    const MoneyClaim = Math.floor(Math.random() * (MAX_CLAIM - MIN_CLAIM + 1)) + MIN_CLAIM;
    const LimitClaim = Math.floor(Math.random() * (MAX_CLAIM - MIN_CLAIM + 1)) + MIN_CLAIM;

    // Ambil data user
    const dataUsers = await findUser(sender);
    if (dataUsers) {
        const currentTime = Date.now();
        const CLAIM_COOLDOWN = CLAIM_COOLDOWN_MINUTES * 60 * 1000; // Mengonversi menit ke milidetik

        // Cek apakah user sudah melakukan klaim sebelumnya dalam waktu cooldown
        if (dataUsers.lastClaim && currentTime - dataUsers.lastClaim < CLAIM_COOLDOWN) {
            const remainingTime = Math.floor((CLAIM_COOLDOWN - (currentTime - dataUsers.lastClaim)) / 1000);
            const formattedTime = formatRemainingTime(remainingTime);
            return await sock.sendMessage(
                remoteJid,
                { text: `🔒 _Kamu Sudah Klaim Sebelumnya!_ _Harap tunggu *${formattedTime}* lagi sebelum kamu bisa klaim kembali_.` },
                { quoted: message }
            );
        }

        // Update data user dengan klaim baru dan waktu klaim
        await updateUser(sender, {
            money: dataUsers.money + MoneyClaim, // Menambahkan money yang didapat
            limit: dataUsers.limit + LimitClaim, // Menambahkan limit yang didapat
            lastClaim: currentTime, // Menyimpan waktu klaim terakhir
        });

        return await sock.sendMessage(
            remoteJid,
            { text: `_Kamu dapat *${MoneyClaim}*_ _money dan *${LimitClaim}* limit!_` },
            { quoted: message }
        );
    } else {
        // Tambahkan user jika belum ada
        await addUser(sender, {
            money: MoneyClaim,
            role: "user",
            status: "active",
            lastClaim: Date.now(), // Menyimpan waktu klaim pertama kali
        });

        return await sock.sendMessage(
            remoteJid,
            { text: `Selamat datang! Kamu dapat *${MoneyClaim}* money.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['claim'],
    OnlyPremium : false,
    OnlyOwner   : false
};
