const { findUser, isOwner, isPremiumUser }  = require("@lib/users");
const { getGroupMetadata, getProfilePictureUrl }    = require("@lib/cache");
const ApiAutoresbot = require("api-autoresbot");
const config        = require("@config");

const getCountryFlag = (sender) => {
    const countryCode = sender.slice(0, 2); // Dua angka pertama
    const flagMap = {
        '62': './62.png', // Indonesia
        '60': './60.png', // Malaysia
    };
    return flagMap[countryCode] || './0.png';
};

const getAchievementBadge = (achievement) => {
    const achievementsList = [
        'gamers', 'coding', 'conqueror', '100', 'content creator',
        'fotografer', 'music', 'ilmuwan', 'petualang', 'hacker',
        'snake', 'bull', 'bear', 'tiger', 'cobra', 'wolf', 'imortal'
    ];
    return achievementsList.includes(achievement) 
        ? `./${achievement}.png` 
        : './gamers.png';
};

async function handle(sock, messageInfo) {
    try {
        const { remoteJid, isGroup, message, sender, pushName } = messageInfo;
        const Nosender = sender.replace('@s.whatsapp.net', '');

        const dataUsers = await findUser(sender);
        if (!dataUsers) return;

        if(!isGroup) {
            await sock.sendMessage(remoteJid, { text: 'Gunakan .me2 ya kak' }, { quoted: message });
            return;
        }

        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

        const roleInGrub = isAdmin ? 'Admin' : 'Member';
        const role = await isOwner(sender) 
        ? 'Owner' 
        : await isPremiumUser(sender) 
        ? 'Premium' 
        : dataUsers.role;
        
        const ppUser = await getProfilePictureUrl(sock, sender);
        const flag = getCountryFlag(sender);
        const achievement = getAchievementBadge(dataUsers.achievement);

        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer("/api/maker/profile3", {
            name: pushName,
            level_cache: dataUsers.level_cache || 0,
            nosender: Nosender,
            role,
            level: dataUsers.level || 0,
            money: dataUsers.money || 0,
            limit: dataUsers.limit || 0,
            roleInGrub,
            flag,
            badge: achievement,
            pp: ppUser,
        });

        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: '' },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error.message);
    }
}

module.exports = {
    handle,
    Commands    : ['me','limit'],
    OnlyPremium : false,
    OnlyOwner   : false
};
