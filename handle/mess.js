module.exports = {
    /**
     * Pesan yang berhubungan dengan game atau sesi interaktif
     */
    game: {
        isGroup: 'Fitur game hanya dapat digunakan di dalam grup!',
        isPlaying: 'Sesi game/lamaran lain sedang berlangsung di grup ini. Silakan tunggu hingga selesai.',
        partner_left: 'Partner bermainmu telah keluar dari permainan.',
        no_partner: 'Waktu habis, tidak ada partner yang ditemukan untuk bermain.',
        // Anda bisa tambahkan pesan game lain di sini
    },

    /**
     * Pesan error umum
     */
    error: {
        internal: 'Maaf, terjadi kesalahan pada sistem. Silakan coba lagi nanti.',
        notFound: 'Perintah tidak ditemukan. Ketik .menu untuk melihat daftar perintah.',
        limit: 'Limit harian Anda telah habis. Limit akan direset besok.',
        // Anda bisa tambahkan pesan error lain di sini
    },
    
    /**
     * Pesan yang berhubungan dengan status atau hak akses user
     */
    user: {
        notReg: 'Anda belum terdaftar. Silakan daftar dengan mengetik *.daftar nama.umur*',
        owner: 'Perintah ini hanya untuk Owner Bot.',
        premium: 'Perintah ini khusus untuk pengguna Premium.',
        // Anda bisa tambahkan pesan status user lain di sini
    },

    /**
     * Pesan yang berhubungan dengan konteks grup
     */
    group: {
        admin: 'Perintah ini hanya dapat digunakan oleh admin grup.',
        botAdmin: 'Jadikan bot sebagai admin untuk menggunakan perintah ini.',
        // Anda bisa tambahkan pesan grup lain di sini
    },
    
    /**
     * Pesan tunggu atau proses
     */
    wait: 'Mohon tunggu sebentar...',

    /**
     * Pesan sukses
     */
    success: '✓ Berhasil!',
};
