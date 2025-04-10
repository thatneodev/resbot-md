
const font          = 'ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ ⓖ ⓗ ⓘ ⓙ ⓚ ⓛ ⓜ ⓝ ⓞ ⓟ ⓠ ⓡ ⓢ ⓣ ⓤ ⓥ ⓦ ⓧ ⓨ ⓩ ⓪ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ️ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ';
const commandName   = 'style4';






const { reply, style } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        if (!content) {
            return await reply(m, `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_`);
        }

        const result = style(content, font);
        if (!result) {
            return await reply(m, '⚠️ _Failed to apply style. Please check your input._');
        }

        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in handle function:', error);
        await sock.sendMessage(remoteJid, { text: `_Error: ${error.message}_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : [commandName],
    OnlyPremium : false,
    OnlyOwner   : false
};
