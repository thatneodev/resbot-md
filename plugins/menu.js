const linkGroup = 'https://whatsapp.com/channel/0029VabMgUy9MF99bWrYja2Q';
const AUDIO_MENU = true; // jadikan false untuk mematikan

const fs          = require("fs");
const path        = require("path");
const config      = require("@config");
const { readFileAsBuffer } = require('@lib/fileHelper');
const { reply, style, getCurrentDate, readMore } = require('@lib/utils');
const { isOwner, isPremiumUser }                 = require("@lib/users");

const soundPagi     = 'pagi.m4a'; // bisa .mp3
const soundSiang    = 'siang.m4a';
const soundSore     = 'sore.m4a';
const soundPetang   = 'petang.m4a';
const soundMalam    = 'malam.m4a'; // lokasi file ada di ./database/audio

function getGreeting() {
    const now = new Date();
    const utcHours = now.getUTCHours(); // Jam UTC
    const wibHours = (utcHours + 7) % 24;
    // Tentukan file audio berdasarkan jam
    let fileName;

    if (wibHours >= 5 && wibHours <= 10) {
        fileName = soundPagi;
    } else if (wibHours >= 11 && wibHours < 15) {
        fileName = soundSiang;
    } else if (wibHours >= 15 && wibHours <= 18) {
        fileName = soundSore;
    } else if (wibHours > 18 && wibHours <= 19) {
        fileName = soundPetang;
    } else {
        fileName = soundMalam;
    }

    // Ambil lokasi file berdasarkan direktori kerja utama (process.cwd())
    const filePath = path.join(process.cwd(), "database", "audio", fileName);

    try {
        // Baca file sebagai buffer
        const audioBuffer = fs.readFileSync(filePath);
        return audioBuffer;
    } catch (err) {
        console.error("Error reading file:", err);
        return null;
    }
}

const menu = {
    admin: [
        'add', 'addbadword','antilink', 'ban', 'banfitur', 'delbadword', 'delete', 'demote', 'demoteall', 'editdesk', 
        'editsubject', 'gcsider', 'grub', 'hidetag', 'kick', 'listabsen', 'listadmin', 'listalluser', 
        'listban', 'listmember', 'mute', 'off', 'on', 'promote', 'promoteall', 'resetlinkgc', 'resettotalchat', 
        'setclosegc', 'setdemote', 'setleft', 'setopengc', 'setppgrub', 'setpromote', 'setwelcome', 'tagall', 
        'templatelist', 'templatewelcome', 'top', 'totalchat', 'unban', 'unbanfitur',
    ],
    ai: [
        { command: 'ai', description: '*text*' },
        { command: 'simi', description: '*text*' },
        { command: 'vn', description: '*text*' },
        { command: 'voiceai', description: '*text*' },
    ],
    anime: [
        'waifu', 'husbando', 'neko', 'shinobu', 'megumin',
        'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick',
        'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile',
        'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp',
        'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe',
    ],
    berita: [
        'antara','cnn', 'cnbc', 'jpnn','kumparan','merdeka','okezone','republika', 'sindonews','tempo', 'tribun',
    ],
    download: [
        'fb', 'ig', 'igfoto', 'lirik','pin','play','spotify','tiktoksearch','ttslide','tiktok','ttmp3','twiter','ytmp3','ytmp4','ytsearch',
    ],
    game: [
        'blackjack','caklontong', 'cekkodam', 'dare','family100','math','suit','tebakangka', 'tebakbendera','tebakbom', 'tebakgambar', 'tebakhewan', 'tebakkalimat','tebakkata','tebaklagu','tebaklirik','tictactoe','truth',
    ],
    grub: [
        'absen','afk','badword','buylimit','cekprem','ceksewa','claim','getpic','infogc','linkgrub','me','me2','sendlimit','sendmoney','setakun',
    ],
    editor: [
        'blur','duotone','flipx','flipy','grayscale','resize','rotate','sepia','tajam','wasted','wanted'
    ],
    information: [
        'artimimpi','artinama','infogempa','kbbi','mlcek','ffcek','pubgcek','codcek','stalktiktok'
    ],
    islami: [
        'azan','doa','hadits','jadwalsholat','jadwalsholat2','listsurah','niatsholat','surah','zikir',
    ],
    kerang: [
        'bisakah','cekbucin','cekcantik','cekganteng','cekgila','cekmati','cektolol','jadian','kapankah',
    ],
    maker: [
        'attp','attp2','brat','brat2','bratvid','bratcustom','qc','qc2','qcstick','smeme','sticker','ttp','wm',
    ],
    more: [
        'apikey','cekapikey','grubbot','sc','style','tutor','ratelimit','report',
    ],
    owner: [
        'addlevel','addlimit','addmoney','addowner','addplugin','addpremium','addrespon','addglobalbadword','block','backup','buatstory','creategc','delowner','delplugin','delprem','deletejadibot','delresponse','delsewa','delglobalbadword','demoteme','gctag','grubbot','infosystem','ipserver','jadibot','join','jpm','listblock','listprem','listrespon','listsewa','listjadibot','outallgc','outgc','promoteme','public','reset','restart','self','setbio','setname','setppbot','stopjadibot','sewabot','sewabotid',,'tambahsewa','totalsewa','unblock','update',
    ],
    panel: [
        'statuspanel', 'createserver', 'createuser', 'listserver', 'listuser', 'delserver', 'deluser', 'finduser', 'saveuser','resetserver','resetuser','1gb','2gb','3gb','4gb','5gb','6gb','7gb','8gb','unlimited',
    ],
    pushkontak: [
        'listgc', 'pushkontak', 'savekontak', 'totalgc','totalgc2',
    ],
    random: [
        'aesthetic', 'cecan', 'cogan', 'cosplay', 'darkjoke', 'hacker', 'kucing', 'memeindo', 'motivasi', 'pubg', 'thailand', 'vietnam', 'walhp','animequotes', 'bucinquote', 'dilanquote', 'faktaunik', 'jawaquote', 'jokes', 'motivasi', 'pantun', 'quotes',
    ],
    store: [
        'addlist','dellist','done','list','proses','renamelist','resetlist','updatelist',
    ],
    textpro: [
        '3dbox','blackpink','boom','gaming','magma','marvel','matrix','metal','neon','shadow','signature','sliced','snow','pornhub','valentine','winter','wolf',
    ],
    tools: [
        'cekdns','cekhost','cekuser','createqr','emojimix','get','google','git','hd','hd2','hd3','inspect','image','ipcheck','lorem','numberbot','detectqr','removebg','ssweb','tomp3','tourl','toimg','tom4a','translate','voicechanger','whois',
    ],
};


async function handle(sock, messageInfo) {
    
    const { m, remoteJid, pushName, sender, content, prefix, command, message } = messageInfo;

    const roleUser  = await isOwner(sender) ? 'Owner' : await isPremiumUser(sender) ? 'Premium' : 'user';

    const date      = getCurrentDate();
    const category  = content.toLowerCase();

    let response;
    let result;
    if (category && menu[category]) { // Jika kategori ditemukan
        response = formatMenu(category.toUpperCase(), menu[category]);
        result = await reply(m, style(response) || 'Failed to apply style.');

    } else {
        if (command === 'menu') {
            response = `
┏━『 *MENU UTAMA* 』
┃
${Object.keys(menu).map(key => `┣⌬ ${key}`).join('\n')}
┗━━━━━━━◧
            
_Ketik nama kategori untuk melihat isinya._ \n\n_Contoh: *.menu ai*_ atau *.allmenu* untuk menampilkan semua menu`;
        result = await reply(m, style(response) || 'Failed to apply style.');

        } else if (command === 'allmenu') { // Menampilkan semua menu
            
            response = `
╭─────────────
│ ᴺᵃᵐᵉ  : *${pushName || 'Unknown'}*
│ ˢᵗᵃᵗᵘˢ : *${roleUser}*
│ ᴰᵃᵗᵉ   : *${date}*
├────
╰──────────────

${readMore()}

${Object.keys(menu).map(key => formatMenu(key.toUpperCase(), menu[key])).join('\n\n')}
            `;

            const buffer = readFileAsBuffer('@assets/allmenu.jpg');
          
            result = await sock.sendMessage(remoteJid, {
                text : style(response),
                contextInfo: {
                externalAdReply: {
                    showAdAttribution: true, 
                    title: `Halo ${pushName}`,
                    body: `Resbot ${config.version}`,
                    thumbnail: buffer,
                    thumbnailUrl: linkGroup,
                    sourceUrl: linkGroup,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
                }
            },{ quoted: message });

        }
    }

    if(command === 'allmenu' || (command === 'menu' && content === '')) { // kirim audio ketika allmenu
        if(AUDIO_MENU){
            const audioBuffer = getGreeting();
            await sock.sendMessage(remoteJid, { audio: audioBuffer , mimetype: 'audio/mp4', ptt: true }, { quoted : result})
        }
    }

}

const formatMenu = (title, items) => {
    const formattedItems = items.map(item => {
        if (typeof item === 'string') {
            return `┣⌬ ${item}`;
        }
        if (typeof item === 'object' && item.command && item.description) {
            return `┣⌬ ${item.command} ${item.description}`;
        }
        return '┣⌬ [Invalid item]';
    });

    return `┏━『 *${title.toUpperCase()}* 』\n┃\n${formattedItems.join('\n')}\n┗━━━━━━━◧`;
};

module.exports = {
    handle,
    Commands    : ['menu', 'allmenu'],
    OnlyPremium : false,
    OnlyOwner   : false
};