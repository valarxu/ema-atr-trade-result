const fs = require('fs');
const path = require('path');
const { convertTradingData } = require('./convert-trading-data');

/**
 * 批量转换交易数据脚本
 * 自动处理origin-data目录下的所有CSV文件
 */

function getCSVFiles(directory) {
    try {
        const files = fs.readdirSync(directory);
        return files.filter(file => file.endsWith('.csv'));
    } catch (error) {
        console.error(`无法读取目录 ${directory}:`, error.message);
        return [];
    }
}

function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        console.log(`创建目录: ${directory}`);
    }
}

async function batchConvert() {
    const inputDir = 'origin-data';
    const outputDir = 'converted-data';
    
    console.log('🚀 开始批量转换交易数据...\n');
    
    // 确保输出目录存在
    ensureDirectoryExists(outputDir);
    
    // 获取所有CSV文件
    const csvFiles = getCSVFiles(inputDir);
    
    if (csvFiles.length === 0) {
        console.log(`❌ 在 ${inputDir} 目录下没有找到CSV文件`);
        return;
    }
    
    console.log(`📁 发现 ${csvFiles.length} 个CSV文件:`);
    csvFiles.forEach(file => console.log(`   - ${file}`));
    console.log();
    
    const results = [];
    
    for (const file of csvFiles) {
        const inputFile = path.join(inputDir, file);
        const outputFile = path.join(outputDir, file.replace('.csv', '-trades.json'));
        
        console.log(`📊 正在处理: ${file}`);
        
        try {
            const result = convertTradingData(inputFile, outputFile);
            const stats = result.summary.overallStats;
            
            results.push({
                file,
                success: true,
                stats: {
                    totalTrades: stats.totalTrades,
                    totalPnl: stats.totalPnl,
                    totalReturnRate: stats.totalReturnRate,
                    longWinRate: stats.longWinRate,
                    shortWinRate: stats.shortWinRate
                }
            });
            
            console.log(`   ✅ 转换成功: ${stats.totalTrades}笔交易, 总盈亏: ${stats.totalPnl.toFixed(2)}USDT, 收益率: ${stats.totalReturnRate}%`);
            
        } catch (error) {
            console.log(`   ❌ 转换失败: ${error.message}`);
            results.push({
                file,
                success: false,
                error: error.message
            });
        }
        
        console.log();
    }
    
    // 显示汇总报告
    console.log('📋 批量转换完成报告:');
    console.log('=' .repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ 成功: ${successful.length} 个文件`);
    console.log(`❌ 失败: ${failed.length} 个文件`);
    console.log();
    
    if (successful.length > 0) {
        console.log('📈 成功文件统计:');
        successful.forEach(result => {
            const stats = result.stats;
            console.log(`   ${result.file}:`);
            console.log(`     交易数: ${stats.totalTrades}, 盈亏: ${stats.totalPnl.toFixed(2)}USDT`);
            console.log(`     收益率: ${stats.totalReturnRate}%, 多单胜率: ${stats.longWinRate}%, 空单胜率: ${stats.shortWinRate}%`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ 失败文件:');
        failed.forEach(result => {
            console.log(`   ${result.file}: ${result.error}`);
        });
    }
    
    console.log('\n🎯 建议:');
    console.log('- 使用 node server.js 启动服务器查看可视化分析');
    console.log('- 在浏览器中访问 http://localhost:8080');
    console.log('- 可以修改 trading-analyzer.html 中的数据文件路径来查看不同币种的分析');
}

// 主函数
function main() {
    console.log('🔄 EMA-ATR交易数据批量转换工具');
    console.log('=' .repeat(50));
    
    batchConvert().catch(error => {
        console.error('批量转换过程出错:', error);
        process.exit(1);
    });
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { batchConvert };