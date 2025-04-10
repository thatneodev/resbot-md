const mess = require("@mess");
const config = require("@config");
const { getActiveUsers }          = require("@lib/users");
const { sendMessageWithMention } = require('@lib/utils');
const { getGroupMetadata } = require("@lib/cache");

let inProccess = false;

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content } = messageInfo;
    if (!isGroup) return; // Only Grub

    try {

        // Mendapatkan metadata grup
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        if(inProccess) {
            await sendMessageWithMention(sock, remoteJid, `_Proses pembersihan member sider sedang berlangsung silakan tunggu hingga selesai_`, message);
            return 
        }

        const listNotSider = await getActiveUsers();
        if (listNotSider.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '📋 _Tidak ada member sider di grup ini._' },
                { quoted: message }
            );
        }

        const memberList = participants
    .filter(participant => !listNotSider.some(active => active.id === participant.id))
    .map(participant => participant.id);

        // Hitung jumlah member sider yang ada di grup
        const countSider = participants.filter(participant => !listNotSider.some(active => active.id === participant.id)).length;
    
        const totalsider = countSider;
        const totalMember = participants.length;

        if (content.toLowerCase() == '-y') {
            await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });
            inProccess = true;
        
            let successCount = 0;
            let failedCount = 0;
        
            for (const [index, member] of memberList.entries()) {
                await new Promise(resolve => setTimeout(resolve, index * 3000));
                
                if (member === `${config.phone_number_bot}@s.whatsapp.net`) {
                    continue; // Skip dan lanjut ke iterasi berikutnya
                }
                try {
                    await sock.groupParticipantsUpdate(remoteJid, [member], 'remove');
                    successCount++;
                } catch (error) {
                    failedCount++;
                }
            }
        
            inProccess = false;
            if (successCount == totalsider) {
                await sendMessageWithMention(sock, remoteJid, `_Berhasil mengeluarkan semua member sider_`, message);
            } else {
                await sendMessageWithMention(sock, remoteJid, `_Berhasil mengeluarkan ${successCount} dari ${totalMember} member sider_`, message);
            }
            return;
        }
        
        // Kirim pesan dengan mention
        await sendMessageWithMention(sock, remoteJid, `_Total Sider *${totalsider}* dari ${totalMember}_ \n\n_Untuk melanjutkan kick member sider, ketik *.kicksider -y*_`, message);

    } catch (error) {
        console.error("Error handling kick sider command:", error);
        return await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses permintaan Anda." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["kicksider"],
    OnlyPremium : false,
    OnlyOwner   : false
};
