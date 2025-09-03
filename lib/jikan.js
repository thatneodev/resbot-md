const fetch = require('node-fetch');

/**
 * [PRIORITAS 2] Mencari karakter di MyAnimeList menggunakan Jikan API.
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
 * [FALLBACK 1] Mencari karakter di Sonic Fandom Wiki menggunakan MediaWiki API.
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
 * [FALLBACK 2] Mencari YouTuber/Karakter di Wikitubia menggunakan MediaWiki API.
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

/**
 * [PRIORITAS 1] Mencari karakter di seluruh jaringan Fandom dengan menemukan wiki yang relevan terlebih dahulu.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter terstandarisasi atau null.
 */
async function searchGenericFandomCharacter(query) {
    try {
        const findWikiUrl = `https://www.fandom.com/api/v1/Wikis/List?query=${encodeURIComponent(query)}&limit=1&lang=en`;
        const findWikiResponse = await fetch(findWikiUrl);
        if (!findWikiResponse.ok) return null;

        const findWikiJson = await findWikiResponse.json();
        if (!findWikiJson.items || findWikiJson.items.length === 0) return null;
        
        const wikiData = findWikiJson.items[0];
        const wikiDomain = wikiData.domain;
        const wikiName = wikiData.name;

        const searchUrl = `https://${wikiDomain}/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) return null;

        const searchJson = await searchResponse.json();
        if (!searchJson.query?.search?.length) return null;
        
        const pageTitle = searchJson.query.search[0].title;

        const pageDetailsUrl = `https://${wikiDomain}/api.php?action=query&prop=pageimages|extracts&titles=${encodeURIComponent(pageTitle)}&pithumbsize=500&exintro=1&explaintext=1&format=json&utf8=1`;
        const detailsResponse = await fetch(pageDetailsUrl);
        if (!detailsResponse.ok) return null;

        const detailsJson = await detailsResponse.json();
        const pageId = Object.keys(detailsJson.query.pages)[0];
        const pageData = detailsJson.query.pages[pageId];

        if (!pageData) return null;

        return {
            id: pageData.title,
            source: wikiName,
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

/**
 * [FUNGSI UTAMA - URUTAN DIPERBARUI]
 * Mencari karakter dengan prioritas Fandom Umum > MyAnimeList > Fallback lainnya.
 * @param {string} query Nama karakter yang dicari.
 * @returns {object|null} Data karakter atau null jika tidak ditemukan.
 */
async function searchCharacter(query) {
    // 1. Prioritas utama: Mencari di Fandom secara umum.
    console.log(`🔍 Mencari "${query}" di Fandom (umum)...`);
    let character = await searchGenericFandomCharacter(query);

    if (character) {
        console.log(`✅ Ditemukan melalui Fandom Search di sumber: ${character.source}.`);
        return character;
    }

    // 2. Jika tidak ada, coba MyAnimeList.
    console.log(`... Tidak ditemukan. Mencoba di MyAnimeList...`);
    character = await searchMalCharacter(query);

    if (character) {
        console.log(`✅ Ditemukan di MyAnimeList.`);
        return character;
    }

    // 3. Fallback ke wiki spesifik jika perlu.
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
    } else {
        console.log(`❌ Karakter "${query}" tidak ditemukan di semua sumber.`);
    }

    return character;
}

module.exports = { searchCharacter };
