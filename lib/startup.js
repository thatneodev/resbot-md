const os = require('os');
const chalk = require('chalk');
const figlet = require('figlet');
const axios = require('axios');
const config = require("@config");
const { success, danger } = require('@lib/utils');
const { connectToWhatsApp } = require('@lib/connection');

// === Pengaturan Umum ===
const TERMINAL_WIDTH = Math.min(process.stdout.columns || 60, 120);
const MIN_WIDTH_FOR_FIGLET = 40;
const PADDING = 4;

// Simbol estetik
const ICONS = {
    server: '🖥️',
    memory: '🧠',
    uptime: '⏱️',
    ip: '🌐',
    mode: '⚙️',
    api: '🔑',
    info: 'ℹ️',
    warn: '⚠️',
    heart: '💙'
};

// Fungsi: garis horizontal
const line = (char = '─', length = TERMINAL_WIDTH) => char.repeat(length);

// Fungsi: center text
const center = (text) => {
    const pad = Math.max(0, Math.floor((TERMINAL_WIDTH - text.length) / 2));
    return ' '.repeat(pad) + text;
};

// Cache IP
let cachedIP = null;

// Ambil IP publik (dengan fallback)
const getPublicIP = async () => {
    if (cachedIP) return cachedIP;

    const services = [
        'https://api.ipify.org?format=json',
        'https://ipv4.icanhazip.com',
        'https://ifconfig.me/ip'
    ];

    for (const url of services) {
        try {
            const { data } = await axios.get(url, { timeout: 3000 });
            const ip = typeof data === 'object' ? data.ip : data.trim();
            if (ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
                cachedIP = ip;
                return ip;
            }
        } catch (e) { continue; }
    }

    throw new Error('Gagal ambil IP publik');
};

// Dapatkan info server
const getServerSpecs = async () => ({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`,
    uptime: `${(os.uptime() / 3600).toFixed(2)} jam`,
    publicIp: await getPublicIP(),
    mode: config.mode
});

// Cek status APIKEY
const getStatusApikey = async () => {
    try {
        const res = await axios.get(`https://api.autoresbot.com/check_apikey?apikey=${config.APIKEY}`);
        const { limit_apikey } = res.data || {};
        return limit_apikey > 0 
            ? chalk.greenBright(`✅ ${limit_apikey} tersisa`) 
            : chalk.redBright.bold('LIMIT HABIS');
    } catch (err) {
        const { response } = err;
        if (response?.status === 403) return 403;
        if (response?.data?.error_code === 'INVALID_API_KEY') return chalk.redBright.bold('APIKEY TIDAK VALID');
        return chalk.red('TIDAK TERKONEKSI');
    }
};

// Tampilkan info server
async function showServerInfo(options = {}) {
    const {
        title = "RESBOT",
        borderColor = '═',
        titleColor = chalk.cyanBright
    } = options;

    let specs, apiStatus;

    try {
        specs = await getServerSpecs();
        apiStatus = await getStatusApikey();
    } catch (e) {
        console.log('\n' + chalk.red(line('✖')));
        console.log(center(chalk.red.bold(`${ICONS.warn} GAGAL MEMUAT DATA`)));
        console.log(center(chalk.gray('Cek koneksi internet atau konfigurasi')));
        console.log('\n' + chalk.red(line('✖')) + '\n');
        process.exit(1);
    }

    // Handle error 403 (IP tidak diizinkan)
    if (apiStatus === 403) {
        console.log('\n' + chalk.yellow(line('⚠')));
        danger("Akses Ditolak", "APIKEY tidak diizinkan dari IP ini.");
        console.log(chalk.yellow(`💡 Solusi: Tambahkan IP Anda ke whitelist di:`));
        console.log(chalk.cyan(`   https://autoresbot.com/services/rest-api`));
        success("IP Anda", specs.publicIp);
        console.log(chalk.yellow(line('⚠')) + '\n');

        // Tunggu 30 detik sebelum keluar
        await new Promise(r => setTimeout(r, 30000));
        process.exit(1);
    }

    // Render judul dengan figlet (fallback ke teks biasa)
    let titleLines = [];
    if (TERMINAL_WIDTH >= MIN_WIDTH_FOR_FIGLET) {
        try {
            const figletText = figlet.textSync(title, {
                font: 'Small Slant',
                width: TERMINAL_WIDTH - 6,
                whitespaceBreak: true
            });
            titleLines = figletText.split('\n').map(line => center(line));
        } catch (e) {
            titleLines = [center(chalk.bold(titleColor(title)))];
        }
    } else {
        titleLines = [center(chalk.bold(titleColor(title)))];
    }

    const border = titleColor(line(borderColor));

    // Field info server
    const fields = [
        [ICONS.server, 'Hostname', specs.hostname],
        [ICONS.server, 'Platform', specs.platform],
        [ICONS.server, 'Arch', specs.arch],
        [ICONS.memory, 'Total RAM', specs.totalMemory],
        [ICONS.memory, 'RAM Bebas', specs.freeMemory],
        [ICONS.uptime, 'Uptime', specs.uptime],
        [ICONS.ip, 'IP Publik', specs.publicIp],
        [ICONS.mode, 'Mode', chalk.bold(specs.mode.toUpperCase())],
        [ICONS.api, 'Status API', apiStatus]
    ];

    // Hitung padding maksimal untuk alignment
    const maxLabel = Math.max(...fields.map(([_, label]) => label.length)) + PADDING;
    const renderField = (icon, label, value) =>
        `${chalk.green(icon)}  ${chalk.white(label.padEnd(maxLabel))} : ${value}`;

    const body = fields.map(renderField).join('\n');

    // Tampilkan semua
    console.clear(); // Opsional: bersihkan layar

    console.log('\n');
    console.log(border);
    titleLines.forEach(l => console.log(l));
    console.log(border);

    console.log(`\n${chalk.yellow(`${ICONS.info} Informasi Script:`)}`);
    console.log(`   💻 Versi: Bot atek Async v${global.version || '1.0.0'}`);

    console.log(`\n${chalk.yellow(`${ICONS.server} Spesifikasi Server:`)}`);
    console.log(body);

    console.log('\n' + border);
    console.log(center(`${ICONS.heart} Terima kasih telah menggunakan script ini!`));
    console.log(border);
    console.log('\n');
}

// Jalankan aplikasi
async function start_app() {
    await showServerInfo({
        title: "Bot atek Async",
        borderColor: '╍',
        titleColor: chalk.magentaBright
    });

    connectToWhatsApp();
}

module.exports = { showServerInfo, start_app, getServerSpecs };
