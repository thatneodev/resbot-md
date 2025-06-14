const fs = require('fs').promises;
const path = require('path');
const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const api = new ApiAutoresbot(config.APIKEY);
const { textToAudio } = require('@lib/features');
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText, pushName } = messageInfo;

    if (!fullText.includes("odam")) return true;

    const nameCekodam = content.trim() || pushName;

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Panggil API Kodam
        const response = await api.get(`/api/game/kodam`);
        if (!response?.data) {
            console.error("⚠️ API response is empty or invalid:", response);
            return false;
        }

        const kodam = response.data;
        const resultKodam = `Nama, ${nameCekodam} , , , Kodam , ${kodam}`;
        let bufferAudio = await textToAudio(resultKodam);

        if (!bufferAudio) {
            console.error("⚠️ Gagal menghasilkan audio dari teks.");
            return false;
        }

        const inputPath = path.join(process.cwd(), generateUniqueFilename());
        await fs.writeFile(inputPath, bufferAudio);

        let bufferFinal = bufferAudio; // Default gunakan buffer original

        try {
            const convertedPath = await convertAudioToCompatibleFormat(inputPath);
            bufferFinal = await fs.readFile(convertedPath);
        } catch (err) {
        }

        await sock.sendMessage(remoteJid, {
            audio: bufferFinal,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: message });

    } catch (error) {
        console.error("⚠️ Terjadi kesalahan:", error);

        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti.\n\n${error.message || "Kesalahan tidak diketahui"}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["kodam", "cekkodam", "cekkhodam", "cekodam"],
    OnlyPremium: false,
    OnlyOwner: false,
};
