let groupCache          = {};
let profilePictureCache = {};
let groupFetchCache     = {};
const sessions          = new Map();

const DEFAULT_PROFILE_PICTURE_URL = 'https://api.autoresbot.com/api/maker/pp-default';
const CACHE_TIME        = 10; // menit
const CACHE_METADATA    = CACHE_TIME * 60000;
const CACHE_groupFetch  = CACHE_TIME * 60000; // 1 menit (60000 ms)

const getGroupMetadata = async (sock, remoteJid) => {
    if (!groupCache[remoteJid]) {
        groupCache[remoteJid] = await sock.groupMetadata(remoteJid);
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



module.exports = { getGroupMetadata, getProfilePictureUrl, groupFetchAllParticipating, clearGroupCache, sessions };
