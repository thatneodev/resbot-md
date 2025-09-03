const fetch = require('node-fetch');

/**
 * Mencari karakter di MyAnimeList menggunakan Jikan API.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchMalCharacter(query) {
    try {
        const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url);
        if (!response.ok) return null; // Gagal fetch
        
        const json = await response.json();

        if (!json.data || json.data.length === 0) {
            return null; // Karakter tidak ditemukan
        }

        const char = json.data[0];
        // Mengembalikan data dalam format standar
        return {
            id: char.mal_id, // ID unik dari sumbernya
            source: 'MyAnimeList', // Penanda sumber data
            name: char.name,
            image_url: char.images?.jpg?.image_url,
            about: char.about ? char.about.split('\n')[0] : 'Tidak ada deskripsi.',
            url: char.url
        };
    } catch (error) {
        console.error("❌ Error fetching from Jikan API:", error);
        return null;
    }
}

/**
 * Mencari karakter di Sonic Fandom Wiki menggunakan MediaWiki API.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchFandomCharacter(query) {
    try {
        // Step 1: Cari halaman berdasarkan query untuk mendapatkan judul yang tepat
        const searchUrl = `https://sonic.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        // Step 2: Ambil detail halaman (gambar, deskripsi) menggunakan judul yang didapat
        const pageDetailsUrl = `https://sonic.fandom.com/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        // Mengembalikan data dalam format standar
        return {
            id: pageData.title, // ID unik dari sumbernya (judul halaman)
            source: 'Sonic Fandom', // Penanda sumber data
            name: pageData.title,
            image_url: pageData.thumbnail?.source,
            about: pageData.extract || 'Tidak ada deskripsi.',
            url: `https://sonic.fandom.com/wiki/${encodeURIComponent(pageData.title.replace(/ /g, '_'))}`
        };

    } catch (error) {
        console.error("❌ Error fetching from Fandom API:", error);
        return null;
    }
}

/**
 * [BARU] Mencari YouTuber/Karakter di Wikitubia menggunakan MediaWiki API.
 * @param {string} query Nama YouTuber/Karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchWikitubiaCharacter(query) {
    try {
        // Step 1: Cari halaman berdasarkan query untuk mendapatkan judul yang tepat
        const searchUrl = `https://youtube.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        // Step 2: Ambil detail halaman (gambar, deskripsi) menggunakan judul yang didapat
        const pageDetailsUrl = `https://youtube.fandom.com/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        // Mengembalikan data dalam format standar
        return {
            id: pageData.title, // ID unik dari sumbernya (judul halaman)
            source: 'Wikitubia', // Penanda sumber data
            name: pageData.title,
            image_url: pageData.thumbnail?.source,
            about: pageData.extract || 'Tidak ada deskripsi.',
            url: `https://youtube.fandom.com/wiki/${encodeURIComponent(pageData.title.replace(/ /g, '_'))}`
        };

    } catch (error) {
        console.error("❌ Error fetching from Wikitubia API:", error);
        return null;
    }
}

/**
 * [DIPERBARUI] Fungsi utama untuk mencari karakter dari berbagai sumber.
 * Mencoba MyAnimeList, lalu Sonic Fandom, dan terakhir Wikitubia.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter atau null jika tidak ditemukan di mana pun.
 */
async function searchCharacter(query) {
    console.log(`🔍 Mencari "${query}" di MyAnimeList...`);
    let character = await searchMalCharacter(query);

    if (character) {
        console.log(`✅ Ditemukan di MyAnimeList.`);
        return character;
    }

    console.log(`... Tidak ditemukan. Mencoba di Sonic Fandom Wiki...`);
    character = await searchFandomCharacter(query);
    
    if (character) {
        console.log(`✅ Ditemukan di Sonic Fandom Wiki.`);
        return character;
    }

    console.log(`... Tidak ditemukan. Mencoba di Wikitubia...`);
    character = await searchWikitubiaCharacter(query);

    if (character) {
        console.log(`✅ Ditemukan di Wikitubia.`);
    }

    return character; // Mengembalikan hasil dari Wikitubia (bisa berupa objek atau null)
}

module.exports = { searchCharacter };
