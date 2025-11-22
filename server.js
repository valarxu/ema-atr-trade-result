const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * 简单的HTTP服务器，用于展示交易数据分析页面
 */

const server = http.createServer((req, res) => {
    if (req.url === '/api/coins') {
        const dir = path.join(__dirname, 'converted-data');
        fs.readdir(dir, (err, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'failed' }));
                return;
            }
            const coins = files
                .filter(f => f.endsWith('-trades.json'))
                .map(f => f.replace('-trades.json', ''))
                .sort();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ coins }));
        });
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`🚀 交易数据分析服务器已启动！`);
    console.log(`📊 访问地址: http://${HOST}:${PORT}`);
    console.log(`📈 数据文件: converted-data/btc-trades.json`);
    console.log('');
    console.log('功能特点:');
    console.log('✅ 总体交易统计');
    console.log('✅ 年度盈亏对比图表');
    console.log('✅ 多空胜率分析');
    console.log('✅ 月度趋势分析');
    console.log('✅ 详细交易记录表格');
    console.log('✅ 年份筛选功能');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
});

module.exports = server;