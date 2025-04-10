const { reply } = require("@lib/utils");
const fsp = require("fs").promises;
const fs    = require('fs');
const path  = require('path');
const util = require("util");
const exec2 = util.promisify(require("child_process").exec);
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

async function changePitch(inputPath, outputPath, sampleRate = 44100) {
    try {
        const command = `ffmpeg -i ${inputPath} -af "asetrate=${sampleRate},aresample=${sampleRate}" ${outputPath}`;
        await exec2(command);
        return await fsp.readFile(outputPath);
    } catch (error) {
        console.error("Terjadi kesalahan saat mengubah pitch:", error);
        throw error;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : undefined;

        
        if (mediaType !== "audio") {
            return await reply(m, `⚠️ _Balas audio/vn dengan caption *${prefix + command}*_`);
        }

        // Validasi input
        if (!content) {
            return await reply(m, `⚠️ _Balas audio/vn dengan caption *${prefix + command}*_ \n\n _*Masukkan Karakter*_

> tupai 
> raksasa 
> monster 
> robot 
> bayi 
> kakek 
> alien

Contoh: _*${prefix + command} tupai*_`);
        }

        const media = isQuoted 
            ? await downloadQuotedMedia(message) 
            : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        const helpMessage = `_*Masukkan Karakter*_

> tupai 
> raksasa 
> monster 
> robot 
> bayi 
> kakek 
> alien

Contoh: _*${prefix + command} tupai*_`;

        // Mengirim reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const karakterPitchPairs = [
            { karakter: "tupai", pitch: 48000 },
            { karakter: "raksasa", pitch: 22050 },
            { karakter: "monster", pitch: 40000 },
            { karakter: "robot", pitch: 32000 },
            { karakter: "bayi", pitch: 16000 },
            { karakter: "kakek", pitch: 20000 },
            { karakter: "alien", pitch: 55000 },
        ];

        const selectedPair = karakterPitchPairs.find(pair => pair.karakter === content.toLowerCase());
        if (!selectedPair) {
            return await reply(m, helpMessage);
        }

        const outputPath = `./tmp/voice_changer_${Date.now()}.mp3`;

        try {
            const audioBuffer = await changePitch(mediaPath, outputPath, selectedPair.pitch);

            const baseDir   = process.cwd(); 
            const inputPath = path.join(baseDir, generateUniqueFilename());
            fs.writeFileSync(inputPath, audioBuffer);

            let bufferOriginal = audioBuffer;
            try {
             bufferOriginal = await convertAudioToCompatibleFormat(inputPath);
            } catch{
     
            }
            await sock.sendMessage(remoteJid, { audio: { url : bufferOriginal} , mimetype: 'audio/mp4', ptt: true }, { quoted: message })
            
        } catch (error) {
            console.error("Kesalahan saat mengirim audio:", error);
            return await reply(m, "Gagal mengubah pitch suara.");
        }
    } catch (error) {
        console.error("Kesalahan di fungsi handle:", error);
        await sock.sendMessage(remoteJid, { text: `_Error: ${error.message}_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ["voicechanger"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi
};
