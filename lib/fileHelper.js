const fs = require('fs');
const path = require('path');

const readFileAsBuffer = (aliasPath) => {
    const aliases = {
        '@assets': path.resolve(__dirname, '../database/assets/'), // Ganti dengan lokasi folder assets
    };

    const [alias, ...rest] = aliasPath.split('/');
    if (!aliases[alias]) {
        throw new Error(`Alias "${alias}" tidak ditemukan!`);
    }

    const resolvedPath = path.join(aliases[alias], ...rest);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File "${resolvedPath}" tidak ditemukan!`);
    }

    // Membaca file sebagai buffer
    return fs.readFileSync(resolvedPath);
};

module.exports = { readFileAsBuffer };
