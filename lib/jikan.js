const fetch = require('node-fetch');

// --- [FUNGSI-FUNGSI ASLI ANDA TETAP SAMA] ---
// Salin dan tempel fungsi searchMalCharacter, searchFandomCharacter, 
// dan searchWikitubiaCharacter dari kode asli Anda di sini.
// Mereka tidak perlu diubah.

/**
 * Mencari karakter di MyAnimeList menggunakan Jikan API.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchMalCharacter(query) {
    try {
        const url = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=1`;
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const json = await response.json();
        if (!json.data || json.data.length === 0) return null;

        const char = json.data[0];
        return {
            id: char.mal_id,
            source: 'MyAnimeList',
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
        const searchUrl = `https://sonic.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        const pageDetailsUrl = `https://sonic.fandom.com/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        return {
            id: pageData.title,
            source: 'Sonic Fandom',
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
 * Mencari YouTuber/Karakter di Wikitubia menggunakan MediaWiki API.
 * @param {string} query Nama YouTuber/Karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchWikitubiaCharacter(query) {
    try {
        const searchUrl = `https://youtube.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        const pageDetailsUrl = `https://youtube.fandom.com/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        return {
            id: pageData.title,
            source: 'Wikitubia',
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


// --- [FUNGSI BARU - TANPA API KEY] ---
/**
 * Mencari karakter di seluruh jaringan Fandom dengan pertama-tama menemukan wiki yang relevan.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchGenericFandomCharacter(query) {
    try {
        // Step 1: Temukan wiki yang paling relevan di seluruh Fandom
        const findWikiUrl = `https://www.fandom.com/api/v1/Wikis/List?query=${encodeURIComponent(query)}&limit=1&lang=en`;
        const findWikiResponse = await fetch(findWikiUrl);
        if (!findWikiResponse.ok) return null;

        const findWikiJson = await findWikiResponse.json();
        if (!findWikiJson.items || findWikiJson.items.length === 0) {
            return null; // Tidak ada wiki yang relevan ditemukan
        }
        
        const wikiData = findWikiJson.items[0];
        const wikiDomain = wikiData.domain; // Contoh: "dragonball.fandom.com"
        const wikiName = wikiData.name; // Contoh: "Dragon Ball Wiki"

        // Step 2: Gunakan domain wiki yang ditemukan untuk mencari karakter (logika yang sama seperti sebelumnya)
        const searchUrl = `https://${wikiDomain}/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        // Step 3: Ambil detail halaman dari wiki yang tepat
        const pageDetailsUrl = `https://${wikiDomain}/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        // Mengembalikan data dalam format standar
        return {
            id: pageData.title,
            source: wikiName, // Sumber dinamis berdasarkan wiki yang ditemukan
            name: pageData.title,
            image_url: pageData.thumbnail?.source,
            about: pageData.extract || 'Tidak ada deskripsi.',
            url: `https://${wikiDomain}/wiki/${encodeURIComponent(pageData.title.replace(/ /g, '_'))}`
        };

    } catch (error) {
        console.error("❌ Error fetching from Generic Fandom Search:", error);
        return null;
    }
}


// --- [FUNGSI UTAMA YANG DIPERBARUI] ---
/**
 * [DIPERBARUI] Fungsi utama untuk mencari karakter dari berbagai sumber.
 * Mencoba MyAnimeList, Sonic Fandom, Wikitubia, dan terakhir pencarian Fandom umum.
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
        return character;
    }

    console.log(`... Tidak ditemukan. Mencoba pencarian Fandom umum...`);
    character = await searchGenericFandomCharacter(query);

    if (character) {
        console.log(`✅ Ditemukan melalui Fandom Search di sumber: ${character.source}.`);
    } else {
        console.log(`❌ Karakter "${query}" tidak ditemukan di semua sumber.`);
    }

    return character; // Mengembalikan hasil dari pencarian Fandom (bisa objek atau null)
}

module.exports = { searchCharacter };
