const { listSewa } = require("@lib/sewa");
const { selisihHari, hariini } = require("@lib/utils");
const { groupFetchAllParticipating } = require("@lib/cache");


async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    try {
        // Ambil data list berdasarkan grup
        const sewa = await listSewa();

        // Jika tidak ada list
        if (!sewa || Object.keys(sewa).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '⚠️ _Tidak Ada daftar sewa ditemukan_'
            });
            return;
        }

        // Konversi objek ke array dan urutkan berdasarkan waktu expired terbaru
        const sortedSewa = Object.entries(sewa).sort(([, a], [, b]) => a.expired - b.expired);

        /*
        [
            [
                '120363297254557601@g.us',
                {
                linkGrub: 'https://chat.whatsapp.com/IXPSikg076285Fr25xUqMN',
                start: '22 February 2025',
                expired: 1741061297394,
                createdAt: '2025-02-22T03:08:19.140Z',
                updatedAt: '2025-02-22T03:08:19.140Z'
                }
            ],
            [
                '120363323578728762@g.us',
                {
                linkGrub: 'https://chat.whatsapp.com/B5WDzb1nLqL4oAivHmK8FZ',
                start: '22 February 2025',
                expired: 1826597413670,
                createdAt: '2025-02-22T03:10:15.661Z',
                updatedAt: '2025-02-22T03:10:15.661Z'
                }
            ]
            ]
        */

        const allGroups = await groupFetchAllParticipating(sock);
      
        /*
            {
            '120363367811397877@g.us': {
                id: '120363367811397877@g.us',
                subject: 'nama grub baru',
            },
            '120363371919496557@g.us': {
                id: '120363371919496557@g.us',
                subject: 'Tes Grub #3',
            }
            
    }
        */


        // Buat daftar untuk ditampilkan
        let listMessage = '*▧ 「 LIST SEWA* 」\n\n';
        sortedSewa.forEach(([groupId, data], index) => {
            // Ambil subject dari allGroups jika ada
            const subject = allGroups[groupId] ? allGroups[groupId].subject : 'Nama Grup Tidak Ditemukan';
        
            listMessage += `╭─
│ Subject : ${subject}
│ ID Grup : ${groupId}
│ Expired : ${selisihHari(data.expired)}
╰────────────────────────\n`;
        });
        
        listMessage += `\n*Total : ${sortedSewa.length}*`;
        
        // Kirim pesan daftar sewa
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_Terjadi kesalahan saat mengambil daftar sewa_'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['listsewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};
