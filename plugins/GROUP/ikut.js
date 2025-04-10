async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, sender, message, command } = messageInfo;
    if (!isGroup) return; // Hanya untuk grup

    await joinGiveaway(sock, messageInfo);
    return;
}

async function joinGiveaway(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    
    if (!isGroup) return; // Hanya bisa di grup

    if (!global.giveawayParticipants[remoteJid]) {
        await sock.sendMessage(remoteJid, { 
            text: `⚠ Giveaway belum dimulai! Admin dapat memulai dengan perintah *.giveaway*` 
        }, { quoted: message });
        return;
    }

    if (global.giveawayParticipants[remoteJid].has(sender)) {
        await sock.sendMessage(remoteJid, { 
            text: `⚠ @${sender.split('@')[0]}, kamu sudah bergabung dalam giveaway!` 
        }, { quoted: message, mentions: [sender] });
        return;
    }

    global.giveawayParticipants[remoteJid].add(sender);
    await sock.sendMessage(remoteJid, { 
        text: `✅ @${sender.split('@')[0]} telah bergabung dalam giveaway!` 
    }, { quoted: message, mentions: [sender] });
}

module.exports = {
    handle,
    Commands    : ["ikut"],
    OnlyPremium : false,
    OnlyOwner   : false
};
