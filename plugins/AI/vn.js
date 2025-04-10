const fs = require('fs').promises;
const path = require('path');
const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { textToAudio } = require('@lib/features');
const { logCustom } = require("@lib/logger");
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted } = messageInfo;


    const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

    try {
        if (!text.trim()) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} halo google*_`
            }, { quoted: message });
        }

        let bufferOriginal = await textToAudio(text);
        
        if (!bufferOriginal) {
            const api = new ApiAutoresbot(config.APIKEY);
            bufferOriginal = await api.getBuffer('/api/tts', { text: text });
        }

        const inputPath = path.join(process.cwd(), generateUniqueFilename());
        await fs.writeFile(inputPath, bufferOriginal);

        let bufferFinal = bufferOriginal; // Default menggunakan bufferOriginal

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
        logCustom('error', text, `ERROR-COMMAND-${command}.txt`);
        console.error('⚠️ Terjadi kesalahan:', error);

        await sock.sendMessage(remoteJid, {
            text: `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\n${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['vn'],
    OnlyPremium: false,
    OnlyOwner: false
};
