const fs    = require('fs');
const path  = require('path');
const pluginsPath = path.join(process.cwd(), 'plugins');

let plugins = [];

async function loadPlugins(directory) {
    const loadedPlugins = [];

    try {
        const files = fs.readdirSync(directory);
        
        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                const subPlugins = await loadPlugins(fullPath);
                loadedPlugins.push(...subPlugins);
            } else if (file.endsWith('.js')) {
                try {
            
                    delete require.cache[require.resolve(fullPath)];
                    const plugin = require(fullPath);
                    loadedPlugins.push(plugin);
                } catch (error) {
                    console.error(`❌ ERROR: Gagal memuat plugin: ${fullPath} - ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error(`❌ ERROR: Gagal membaca direktori: ${directory} - ${error.message}`);
    }
    return loadedPlugins;
}

function clearRequireCache(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            clearRequireCache(fullPath);
        } else if (file.endsWith('.js')) {
            try {
                const resolvedPath = require.resolve(fullPath);
                if (require.cache[resolvedPath]) {
                    delete require.cache[resolvedPath];
                }
            } catch {}
        }
    });
}

async function reloadPlugins() {
    try {
        clearRequireCache(pluginsPath);
        plugins = await loadPlugins(pluginsPath); // Gunakan await
        if (plugins.length === 0) {
            console.warn('⚠️ WARNING: Tidak ada plugin yang dimuat.');
        }
    } catch (error) {
        console.error('❌ ERROR: Gagal memuat ulang plugin -', error.message);
    }
    return plugins;
}

module.exports = { reloadPlugins };
