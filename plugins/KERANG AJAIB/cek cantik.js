const config = require('@config');
const { sendMessageWithMention } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText, sender, content, mentionedJid, prefix, command } = messageInfo;

    // Pastikan ada orang yang ditandai
    if (!mentionedJid?.length) {
        return sock.sendMessage(remoteJid, { text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @TAG*_` }, { quoted: message });
    }

    // Cek apakah yang ditandai adalah owner
    const isOwner = `${config.owner_number}@s.whatsapp.net` === mentionedJid[0];

    // Tentukan array kemungkinan jawaban
    const gan = isOwner
        ? ['83', '97', '100', '102', '120', '9999', '127', '86'] // Jawaban spesial untuk owner
        : ['10', '30', '20', '40', '50', '60', '70', '62', '74', '83', '97', '100', '29', '94', '75', '82', '41', '39']; // Jawaban standar

    // Pilih jawaban secara acak
    const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

    // Format pesan dengan menyebutkan user yang ditandai
    const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;

    try {
        // Kirim pesan dengan menyebutkan orang yang ditandai
        await sendMessageWithMention(sock, remoteJid, responseText, message);
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

module.exports = {
    handle,
    Commands    : ["cekcantik"],
    OnlyPremium : false,
    OnlyOwner   : false
};
