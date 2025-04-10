const { reset }        = require('@lib/utils');
const { updateSocket } = require('@lib/scheduled');
const { clearCache }   = require('@lib/globalCache');
const { resetUsers, resetOwners  }   = require('@lib/users');
const { resetGroup  }   = require('@lib/group');
const { resetAllTotalChat }    = require("@lib/totalchat");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    if (!content.trim().toLowerCase().endsWith('-y')) {
        await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Perintah ini akan menghapus seluruh database yang tersimpan pada bot._ \n\nSilakan ketik *${prefix + command} -y* untuk melanjutkan.`,
            },
            { quoted: message }
        );
        return;
    }

    try {
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        
        resetUsers();
        resetOwners();
        resetGroup();
        resetAllTotalChat();

        clearCache();

        await reset();

        await updateSocket(sock);

       

        await sock.sendMessage(remoteJid, { text: '✅ _Semua Database telah direset_' }, { quoted: message });

    } catch (error) {
        console.error('Error during database reset:', error);
        await sock.sendMessage(remoteJid, { text: '_❌ Maaf, terjadi kesalahan saat mereset data._' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['reset'],
    OnlyPremium : false,
    OnlyOwner   : true
};
