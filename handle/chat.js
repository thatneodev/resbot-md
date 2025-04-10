const { incrementUserChatCount }    = require("@lib/totalchat");
const { addChat }                   = require("@lib/chatManager");
const { downloadMedia } = require('@lib/utils');

async function process(sock, messageInfo) {
    const { remoteJid, message, id, sender, isGroup, fullText, type } = messageInfo;
    
    try {
        if(isGroup) {

            await incrementUserChatCount(remoteJid, sender);

            let newMessage;
            if (type === 'sticker') {
                const mediaPath = `./tmp/${await downloadMedia(message)}`;
                newMessage = {
                    id,
                    text: mediaPath,
                    type,
                };
            } else if (fullText) {
                // Jika fullText tersedia, gunakan sebagai teks
                newMessage = {
                    id,
                    text: fullText,
                };
            }

            // Jika newMessage diatur, tambahkan ke obrolan
            if (newMessage) {
                addChat(sender, newMessage);
            }
        }
    } catch (error) {
        console.error("Error dalam proses Chat:", error);
    }

    return true; // Lanjutkan ke plugin berikutnya
}

module.exports = {
    name        : "Chat",
    priority    : 3,
    process
};
