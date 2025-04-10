const { reply } = require('@lib/utils');
const config    = require('@config');

async function handle(sock, messageInfo) {
    const { m } = messageInfo;

    const text = `╭「 𝙎𝘾𝙍𝙄𝙋𝙏 𝘼𝙐𝙏𝙊𝙍𝙀𝙎𝘽𝙊𝙏 」
│
│◧ ᴠᴇʀꜱɪᴏɴ : ${config.version}
│◧ ᴛʏᴘᴇ ᴘʟᴜɢɪɴꜱ
│◧ ɴᴏ ᴇɴᴄ 100%
│◧ ɴᴏ ʙᴜɢ & ɴᴏ ᴇʀʀᴏʀ 
│◧ ʜᴀʀɢᴀ ? free
│◧ ꜰʀᴇᴇ ᴀᴘɪᴋᴇʏ
│◧ ꜰʀᴇᴇ ᴜᴘᴅᴀᴛᴇ
│◧ ʙɪꜱᴀ ʀᴜɴ ᴅɪ ᴘᴀɴᴇʟ
╰────────────────────────◧

╭「 Link Download 」

◧ ᴡᴇʙꜱɪᴛᴇ https://autoresbot.com/download`

        await reply(m, text);
}

module.exports = {
    handle,
    Commands    : ['sc','script'],
    OnlyPremium : false,
    OnlyOwner   : false
};
