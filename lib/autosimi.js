const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { danger, reply } = require('@lib/utils');

// Objek untuk menyimpan status proses
const processingChats = {};

async function autoSimi(sock, messageInfo, content_old) {
    const { m, remoteJid, id, command, isQuoted, content, message, sender, pushName, type, fullText } = messageInfo;

    // Cek apakah chat ini sedang diproses
    if (processingChats[remoteJid]) {
        return;  // Tidak melayani chat lainnya sampai yang sebelumnya selesai
    }

    // Tandai chat ini sebagai sedang diproses
    processingChats[remoteJid] = true;

    try {
  
        if (command === 'simi' && fullText.length < 6) {
            return await reply(m, '_Apaan ?_');
        }

        let content_simi = '';
        if (content_old) {
            content_simi += `Konteks: ${content_old}\n`;  // Gabungkan dengan content_old
        }
        content_simi += `Pertanyaan: ${fullText}`;  // Gabungkan dengan fullText

        const api = new ApiAutoresbot(config.APIKEY);

        // Lakukan panggilan API untuk teks
        const response = await api.get('/api/simi', { text: content_simi, language: 'id' });

        if (response?.data) {
            await reply(m, response.data);
        } else {
            throw new Error("Gagal mendapatkan respons dari API.");
        }

    } catch (error) {
        // Menangani kesalahan dan log dengan baik
        danger(command, `Kesalahan di lib/autosimi.js: ${error.message}`);
        await reply(m, `_Terjadi kesalahan: ${error.message}_`);
    } finally {
        // Hapus status proses setelah selesai
        delete processingChats[remoteJid];
    }
}

module.exports = autoSimi;
