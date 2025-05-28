const respondedSenders  = new Set();
const { getGreeting }   = require('@lib/utils');

async function process(sock, messageInfo) {
    const { sender, remoteJid, isGroup, message, pushName, fullText } = messageInfo;

    // KOMENTARI INI UNTUK MEMATIKAN
    return true;

    const salam = getGreeting();
    if (isGroup) return true; // Abaikan jika pesan berasal dari grup
    if(pushName == 'Unknown') return true;
    if(!fullText) return true;
    if (["batu", "kertas", "gunting"].includes(fullText.toLowerCase())) return;
    

    if(remoteJid == 'status@broadcast') return true; // abaikan story

    // Cek apakah sender sudah pernah diberi respons
    if (respondedSenders.has(sender)) return true;

    const response = `🌟 _*Pesan Otomatis*_ 🌟 

👋 _${salam}_ _Kak_ *${pushName}*, _Nomor ini adalah nomor bot yang tersedia untuk di sewa pada sebuah grub._

⚠️ _Kami sangat melarang jika bot kami digunakan untuk tindak penipuan atau kegiatan ilegal lainnya._

_*Informasi lebih lanjut*_
📞 Owner : https://wa.me/6285246154386?text=sewabot+4.0
💻 Website : https://autoresbot.com
👉 Saluran : https://whatsapp.com/channel/0029VabMgUy9MF99bWrYja2Q`;

    try {
        // Kirim pesan balasan ke pengirim
        await sock.sendMessage(sender, { text: response }, { quoted: message });

        // Tandai pengirim sebagai sudah diberi respons
        respondedSenders.add(sender);
    } catch (error) {
        console.error("Error in first chat process:", error);
    }

    return true;
}

module.exports = {
    name: "First Chat",
    priority: 10,
    process,
};
