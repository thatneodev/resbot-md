let groupCache          = {};
let profilePictureCache = {};
let groupFetchCache     = {};
const sessions          = new Map();

const DEFAULT_PROFILE_PICTURE_URL = 'https://api.autoresbot.com/api/maker/pp-default';
const CACHE_TIME        = 60; // menit
const CACHE_METADATA    = CACHE_TIME * 60000;
const CACHE_groupFetch  = CACHE_TIME * 60000; // 1 menit (60000 ms)

const getGroupMetadata = async (sock, remoteJid) => {
    if (!groupCache[remoteJid]) {
        groupCache[remoteJid] = await sock.groupMetadata(remoteJid);
        groupCache[remoteJid].last_update = Date.now();
        setTimeout(() => delete groupCache[remoteJid], CACHE_METADATA); // Cache 1 menit
    }
    return groupCache[remoteJid];
};

const getProfilePictureUrl = async (sock, sender) => {
    if (!profilePictureCache[sender]) {
        try {
            const url = await sock.profilePictureUrl(sender, 'image');
            profilePictureCache[sender] = url || DEFAULT_PROFILE_PICTURE_URL;
        } catch {
            profilePictureCache[sender] = DEFAULT_PROFILE_PICTURE_URL;
        }
        setTimeout(() => delete profilePictureCache[sender], CACHE_METADATA); // Cache 1 menit
    }
    return profilePictureCache[sender];
};

const groupFetchAllParticipating = async (sock) => {
    // Jika cache global tidak ada, ambil data
    if (!groupFetchCache['global']) {
        try {
            // Ambil data partisipasi grup
            const data = await sock.groupFetchAllParticipating();

            // Simpan data ke cache
            groupFetchCache['global'] = data;

            // Hapus cache setelah 10 menit
            setTimeout(() => {
                delete groupFetchCache['global'];
            }, CACHE_groupFetch);

        } catch (error) {
            console.error('Error fetching group participation:', error.message);
            return false;
        }
    }
    return groupFetchCache['global'];
};

// Fungsi untuk menghapus cache sebelum waktunya
const clearGroupCache = (remoteJid) => {
    if (groupCache[remoteJid]) {
        delete groupCache[remoteJid];
    }
};

const updateParticipant = (remoteJid, number, action = 'add') => {
    if (!groupCache[remoteJid]) {
      groupCache[remoteJid] = {
        id: remoteJid,
        participants: [],
        size: 0,
        last_update: Date.now()
      };
    }
  
    const group = groupCache[remoteJid];
    const jid = number.endsWith('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    const index = group.participants.findIndex(p => p.id === jid);
  
    if (action === 'add') {
      if (index === -1) {
        group.participants.push({ id: jid, admin: null });
      }
    } else if (action === 'remove') {
      if (index !== -1) {
        group.participants.splice(index, 1);
      }
    } else if (action === 'promote') {
      if (index !== -1) {
        group.participants[index].admin = 'admin';
      }
    } else if (action === 'demote') {
      if (index !== -1) {
        group.participants[index].admin = null;
      }
    }
  
    // Update size dan waktu terakhir
    group.size = group.participants.length;
    group.last_update = Date.now();
};

const findParticipantLatest = (number) => {
    const jid = number.endsWith('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
  
    let latestGroup = null;
    let latestTime = 0;
  
    for (const groupId in groupCache) {
      const group = groupCache[groupId];
  
      const found = group.participants?.some(p => p.id === jid);
      if (found && group.last_update > latestTime) {
        latestGroup = {
          groupId: group.id,
          subject: group.subject,
          last_update: group.last_update,
          participant: group.participants.find(p => p.id === jid),
          total_participants: group.size
        };
        latestTime = group.last_update;
      }
    }
  
    return latestGroup;
};

module.exports = { getGroupMetadata, getProfilePictureUrl, groupFetchAllParticipating, clearGroupCache, updateParticipant, findParticipantLatest, sessions };
