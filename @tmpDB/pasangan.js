const proposals = new Map();

/**
 * Menambahkan sesi lamaran baru.
 * @param {string} id - ID unik (remoteJid).
 * @param {object} data - Data lamaran (proposer, proposed, state).
 */
function addProposal(id, data) {
    proposals.set(id, data);
}

/**
 * Menghapus sesi lamaran.
 * @param {string} id - ID unik (remoteJid).
 * @returns {boolean}
 */
function removeProposal(id) {
    return proposals.delete(id);
}

/**
 * Mendapatkan data sesi lamaran.
 * @param {string} id - ID unik (remoteJid).
 * @returns {object | undefined}
 */
function getProposal(id) {
    return proposals.get(id);
}

/**
 * Memeriksa apakah ada lamaran aktif di grup/room.
 * @param {string} id - ID unik (remoteJid).
 * @returns {boolean}
 */
function isProposalActive(id) {
    return proposals.has(id);
}

/**
 * Memeriksa apakah seorang user terlibat dalam lamaran (baik sebagai pelamar atau yang dilamar).
 * @param {string} userId - JID user.
 * @returns {boolean}
 */
function isUserInProposal(userId) {
    for (const [key, value] of proposals.entries()) {
        if (value.proposer === userId || value.proposed === userId) {
            return true;
        }
    }
    return false;
}


module.exports = {
    addProposal,
    removeProposal,
    getProposal,
    isProposalActive,
    isUserInProposal
};
