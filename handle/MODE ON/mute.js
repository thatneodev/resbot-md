const { findGroup } = require("@lib/group");
const { logWithTime } = require('@lib/utils');

async function process(sock, messageInfo) {
    const { remoteJid, command } = messageInfo;

    try {
        // Ambil data grup dari database
        const dataMute = await findGroup(remoteJid);

        if (dataMute) {
            const { fitur } = dataMute;

            if (command === 'debug') {
                console.log(`Status Mute: ${fitur.mute ? 'Aktif' : 'Nonaktif'}`);
            }

            if (fitur.mute) {
                if(command != 'unmute') {
                    logWithTime('System',`GRUB SEDANG DI MUTE`);
                    return false; // Stop
                }
            }
        } 
    } catch (error) {
        console.error("Terjadi kesalahan pada proses Mute:", error.message);
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name        : "Mute",
    priority    : 1,
    process
};
