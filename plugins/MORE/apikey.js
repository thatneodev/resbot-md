const { reply } = require('@lib/utils')
const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Mengirim reaksi loading
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
        const api = new ApiAutoresbot(config.APIKEY);

        // Memanggil API berdasarkan konten
        const response = await api.get('/check_apikey');
        if(response && response.limit_key){
            const tanggalAktif = new Date(response.limit_key * 1000);
            const bulan = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];
            const formattedDate = `${tanggalAktif.getDate()} ${bulan[tanggalAktif.getMonth()]} ${tanggalAktif.getFullYear()}`;
            await reply(m,  `✅ _Apikey Aktif_

◧ _Masa Aktif Hingga :_ *${formattedDate}*
◧ _Request per day :_ *${response.request_count}* / *${response.max_limit === 0 ? 'unlimited' : response.max_limit}*`);
        }else {
            await reply(m, `⛔ _Apikey Tidak Terdaftar / Expired_`);
        }
    } catch (error) {
        await sock.sendMessage(remoteJid, { text: error.message }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['apikey'],
    OnlyPremium : false,
    OnlyOwner   : false
};
