const mess = require('@mess');
const { addUser, removeUser, isUserPlaying } = require("@tmpDB/math");
let { genMath, modes } = require("@games/math");
const { logWithTime }  = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup, command, content, fullText } = messageInfo;

    // Cek apakah user sedang bermain
    const isPlaying = isUserPlaying(remoteJid);
    if (isPlaying) {
        return sock.sendMessage(
            remoteJid,
            { text: mess.game.isPlaying },
            { quoted: message }
        );
    }

    if (!content || content.trim() === "") {
        return sock.sendMessage(
            remoteJid,
            { text: `Contoh penggunaan: *math medium*\n\nMode yang tersedia: ${Object.keys(modes).join(' | ')}` },
            { quoted: message }
        );
    }

    const mode = content.trim().toLowerCase();
    if (!modes[mode]) {
        return sock.sendMessage(
            remoteJid,
            { text: `Mode tidak valid! \n\nMode yang tersedia: ${Object.keys(modes).join(' | ')}` },
            { quoted: message }
        );
    }

    let result;
    try {
        result = await genMath(mode);
    } catch (err) {
        return sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memulai permainan. Silakan coba lagi nanti." },
            { quoted: message }
        );
    }

    // Set timer berdasarkan waktu dari result
    const timer = setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            removeUser(remoteJid); // Hapus user jika waktu habis
            await sock.sendMessage(
                remoteJid,
                { text: `Waktu habis! Jawabannya : ${result.jawaban}` },
                { quoted: message }
            );
        }
    }, result.waktu); // Gunakan waktu dari result
    
    result.timer = timer;
    result.command = fullText;

    // Tambahkan user ke permainan
    addUser(remoteJid, result);

    const waktuDetik = (result.waktu / 1000).toFixed(2);
    await sock.sendMessage(
        remoteJid,
        { text: `*Berapa hasil dari: ${result.soal.toLowerCase()}*?\n\nWaktu: ${waktuDetik} detik` },
        { quoted: message }
    );
console.log(`Jawaban : ${result.jawaban}`)
    logWithTime('Math', `Jawaban : ${result.jawaban}`);
}

module.exports = {
    handle,
    Commands: ["kuismath", "math"],
    OnlyPremium: false,
    OnlyOwner: false,
};
