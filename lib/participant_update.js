const { checkMessage }      = require("@lib/participants");
const ApiAutoresbot         = require("api-autoresbot");
const axios                 = require('axios');
const config                = require("@config");
const { logWithTime, getCurrentDate, sendMessageWithMentionNotQuoted,sendImagesWithMentionNotQuoted, getCurrentTime, getGreeting, getHari } = require('@lib/utils');
const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");
const { findGroup }         = require("@lib/group");
const { updateUser,findUser }            = require("@lib/users");


async function getWelcomeBuffer(api, type, options) {
  console.log(options)
  const endpoints = {
    "1": "/api/maker/welcome1",
    "2": "/api/maker/welcome2",
    "3": "/api/maker/welcome3",
    "4": "/api/maker/welcome4",
    "5": "/api/maker/welcome5",
    "6": "/api/maker/welcome6",
    "7": "/api/maker/welcome7",
  };

  const url = 'https://api.autoresbot.com';
  const endpoint = endpoints[type];
  if (!endpoint) return null;

  try {
    const response = await axios.post(`${url}${endpoint}`, options, {
      responseType: 'arraybuffer', // Mengembalikan data sebagai buffer
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error fetching welcome buffer:", error.message);
    return null;
  }
}



async function handleDetectBlackList(sock, remoteJid, sender) {
  try {
      // Ambil data grup dari database
      const dataGroupSettings = await findGroup(remoteJid);
      if (!dataGroupSettings) return true;
      
      const { fitur } = dataGroupSettings;
      if (!fitur.detectblacklist && !fitur.detectblacklist2) return true;
      
      const user = await findUser(sender);
      if (!user) return true;
      
      const { status } = user;
      
      if (status === 'blacklist') {
         
          
          if (fitur.detectblacklist) {
              const warningMessage = `⚠️ _Peringatan Blacklist_\n\n@${sender.split('@')[0]} telah di blacklist.`;
              await sendMessageWithMentionNotQuoted(sock, remoteJid, warningMessage);
          }

          if (fitur.detectblacklist2) {
            await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove');
            return false;
          }
      }
      return true;
  } catch (error) {
      console.error("Error handling blacklist detection:", error);
      return true;
  }
}



async function handleActiveFeatures(sock, messageInfo, settingGroups) {
  const { id, action, participants, store } = messageInfo;

  if (!id || !action || !participants || participants.length === 0) {
    console.error("Invalid message information provided");
    return;
  }
  
  const { promote = false, demote = false, welcome = false, left = false } = settingGroups;

  const targetNumber  = participants[0];
  const targetMention = `@${targetNumber.split("@")[0]}`;
  const api           = new ApiAutoresbot(config.APIKEY);

  const isBlacklist = await handleDetectBlackList(sock, id, targetNumber);
  if(!isBlacklist) return false;

  // Cek setting grub
  const actions = {
      promote : promote,
      demote  : demote,
      remove  : left,
      add     : welcome
  };
if (!actions[action]) {
  logWithTime('SYSTEM', `Fitur ${action} tidak aktif`);
  return
}

  const result = await checkMessage(id, action);
  if (!result) return;

  let typeWelcome;
  const templatewelcome = await checkMessage(id, 'templatewelcome');
  if (templatewelcome) {
    typeWelcome = templatewelcome;
  }else{
    typeWelcome = config.typewelcome;
  }

  const groupMetadata = await getGroupMetadata(sock, id);
  if (!groupMetadata) {
    console.error("Failed to fetch group metadata");
    return;
  }
    const ppUser = await getProfilePictureUrl(sock, targetNumber);
    const ppGroup = await getProfilePictureUrl(sock, id);
    const contact = store.contacts[targetNumber];

    const pushName =
      contact?.verifiedName ||
      contact?.notify ||
      (typeof targetNumber === 'string' ? targetNumber.split("@")[0] : 'Unknown');
    

    const { subject, desc, size } = groupMetadata;
    const date      = getCurrentDate();
    const time      = getCurrentTime();
    const greeting  = getGreeting();
    const day       = getHari();

    const replacements = {
      "@name": targetMention,
      "@date": date,
      "@day": day,
      "@desc": desc,
      "@group": subject,
      "@greeting": greeting,
      "@size": size,
      "@time": time,
  };

    let customizedMessage = result;
    for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key.replace(/@/, "@"), "gi");
        customizedMessage = customizedMessage.replace(regex, value);
    }

    if (["promote", "demote", "remove"].includes(action)) {
      if (actions[action]) {
          await sendMessageWithMentionNotQuoted(sock, id, customizedMessage);
      }
      return;
  }

  if (action === "add" && welcome) {
    if (typeWelcome === "random") {
      const randomTypes = ["1", "2","3","4","5","6",'text'];
      typeWelcome = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    }

    if (typeWelcome === "text") {
      await sendMessageWithMentionNotQuoted(sock, id, customizedMessage);
      return;
    }

    const buffer = await getWelcomeBuffer(api, typeWelcome, {
      pp: ppUser,
      name: pushName,
      gcname: subject,
      member: size,
      ppgc: ppGroup,
      desk: desc,
      bg: config.bgwelcome2,
    });

    if (buffer) {
      await sendImagesWithMentionNotQuoted(sock, id, buffer, customizedMessage);
    } else {
      console.warn("Unhandled typewelcome or missing buffer");
    }
    return;
  }
}

module.exports = { handleActiveFeatures };
