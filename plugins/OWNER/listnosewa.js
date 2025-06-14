const { listSewa } = require("@lib/sewa");
const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    try {
        // Ambil semua data sewa
        const sewa = await listSewa();

        // Ambil semua grup yang bot ikuti
        const allGroups = await groupFetchAllParticipating(sock);

        let count = 0;
        let listMessage = '*▧ 「 LIST GRUP NON-SEWA 」*\n\n';

        // Iterasi semua grup
        for (const [groupId, groupData] of Object.entries(allGroups)) {
            if (!sewa[groupId]) {
                listMessage += `╭─
│ Subject : ${groupData.subject}
│ ID Grup : ${groupId}
╰────────────────────────\n`;
                count++;
            }
        }

        listMessage += `\n*Total : ${count}*`;

        if (count === 0) {
            listMessage = '✅ _Semua grup merupakan grup sewa._';
        }

        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_Terjadi kesalahan saat mengambil data grup non-sewa._'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['listnosewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};
