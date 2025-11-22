const fs = require('fs');
const path = require('path');

/**
 * 转换交易数据脚本
 * 将原始CSV交易数据转换为JSON格式，按年份分组并计算统计信息
 */

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseTradingData(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    console.log('CSV Headers:', headers);
    
    const trades = [];
    const tradeMap = new Map(); // 用于配对开平仓
    
    // 首先收集所有记录，然后按交易编号分组
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const trade = {};
        
        headers.forEach((header, index) => {
            trade[header] = values[index];
        });
        
        // 解析关键字段
        const tradeNum = parseInt(trade['交易 #']);
        const tradeType = trade['类型']; // 多头进场, 多头出场, 空头进场, 空头出场
        const dateTime = trade['日期/时间'];
        const signal = trade['信号'];
        const price = parseFloat(trade['价格 USDT']);
        const pnl = parseFloat(trade['净损益 USDT']);
        const pnlPercent = parseFloat(trade['净损益 %']);
        
        if (!tradeMap.has(tradeNum)) {
            tradeMap.set(tradeNum, {});
        }
        
        const tradePair = tradeMap.get(tradeNum);
        
        if (tradeType.includes('进场')) {
            // 开仓
            tradePair.entry = {
                tradeNum,
                type: tradeType,
                dateTime,
                signal,
                price,
                position: tradeType.includes('多头') ? 'long' : 'short'
            };
        } else if (tradeType.includes('出场')) {
            // 平仓
            tradePair.exit = {
                tradeNum,
                type: tradeType,
                dateTime,
                signal,
                price,
                pnl,
                pnlPercent,
                position: tradeType.includes('多头') ? 'long' : 'short'
            };
        }
    }
    
    // 处理所有配对完成的交易
    tradeMap.forEach((tradePair, tradeNum) => {
        if (tradePair.entry && tradePair.exit) {
            const completeTrade = {
                tradeNum,
                position: tradePair.entry.position,
                entryDate: tradePair.entry.dateTime,
                entryPrice: tradePair.entry.price,
                entrySignal: tradePair.entry.signal,
                exitDate: tradePair.exit.dateTime,
                exitPrice: tradePair.exit.price,
                exitSignal: tradePair.exit.signal,
                pnl: tradePair.exit.pnl,
                pnlPercent: tradePair.exit.pnlPercent
            };
            trades.push(completeTrade);
        } else {
            console.warn(`交易 #${tradeNum} 缺少完整记录:`, {
                hasEntry: !!tradePair.entry,
                hasExit: !!tradePair.exit
            });
        }
    });
    
    // 按交易编号排序
    trades.sort((a, b) => a.tradeNum - b.tradeNum);
    
    return trades;
}

function groupByYear(trades) {
    const yearGroups = {};
    
    trades.forEach(trade => {
        const year = new Date(trade.exitDate).getFullYear();
        if (!yearGroups[year]) {
            yearGroups[year] = {
                year,
                trades: [],
                longTrades: [],
                shortTrades: [],
                stats: {
                    totalTrades: 0,
                    longTrades: 0,
                    shortTrades: 0,
                    longWins: 0,
                    longLosses: 0,
                    shortWins: 0,
                    shortLosses: 0,
                    totalPnl: 0,
                    longPnl: 0,
                    shortPnl: 0,
                    longWinRate: 0,
                    shortWinRate: 0,
                    totalReturnRate: 0
                }
            };
        }
        
        yearGroups[year].trades.push(trade);
        
        if (trade.position === 'long') {
            yearGroups[year].longTrades.push(trade);
        } else {
            yearGroups[year].shortTrades.push(trade);
        }
    });
    
    return yearGroups;
}

function calculateStats(yearGroups) {
    Object.values(yearGroups).forEach(yearData => {
        const stats = yearData.stats;
        
        // 基本统计
        stats.totalTrades = yearData.trades.length;
        stats.longTrades = yearData.longTrades.length;
        stats.shortTrades = yearData.shortTrades.length;
        
        // 多单统计
        yearData.longTrades.forEach(trade => {
            stats.longPnl += trade.pnl;
            if (trade.pnl > 0) {
                stats.longWins++;
            } else {
                stats.longLosses++;
            }
        });
        
        // 空单统计
        yearData.shortTrades.forEach(trade => {
            stats.shortPnl += trade.pnl;
            if (trade.pnl > 0) {
                stats.shortWins++;
            } else {
                stats.shortLosses++;
            }
        });
        
        // 总盈亏
        stats.totalPnl = stats.longPnl + stats.shortPnl;
        
        // 胜率
        stats.longWinRate = stats.longTrades > 0 ? (stats.longWins / stats.longTrades * 100) : 0;
        stats.shortWinRate = stats.shortTrades > 0 ? (stats.shortWins / stats.shortTrades * 100) : 0;
        
        // 基于初始资金10000USDT计算收益率
        stats.totalReturnRate = (stats.totalPnl / 10000) * 100;
        
        // 保留两位小数
        stats.longWinRate = parseFloat(stats.longWinRate.toFixed(2));
        stats.shortWinRate = parseFloat(stats.shortWinRate.toFixed(2));
        stats.totalReturnRate = parseFloat(stats.totalReturnRate.toFixed(2));
        stats.longPnl = parseFloat(stats.longPnl.toFixed(2));
        stats.shortPnl = parseFloat(stats.shortPnl.toFixed(2));
        stats.totalPnl = parseFloat(stats.totalPnl.toFixed(2));
    });
    
    return yearGroups;
}

function convertTradingData(inputFilePath, outputFilePath) {
    try {
        console.log(`正在读取文件: ${inputFilePath}`);
        const csvContent = fs.readFileSync(inputFilePath, 'utf8');
        
        console.log('正在解析交易数据...');
        const trades = parseTradingData(csvContent);
        console.log(`解析完成，共${trades.length}笔完整交易`);
        
        console.log('正在按年份分组...');
        const yearGroups = groupByYear(trades);
        
        console.log('正在计算统计信息...');
        const result = calculateStats(yearGroups);
        
        // 添加总体统计
        const overallStats = {
            totalTrades: 0,
            longTrades: 0,
            shortTrades: 0,
            longWins: 0,
            longLosses: 0,
            shortWins: 0,
            shortLosses: 0,
            totalPnl: 0,
            longPnl: 0,
            shortPnl: 0,
            longWinRate: 0,
            shortWinRate: 0,
            totalReturnRate: 0
        };
        
        Object.values(result).forEach(yearData => {
            const stats = yearData.stats;
            overallStats.totalTrades += stats.totalTrades;
            overallStats.longTrades += stats.longTrades;
            overallStats.shortTrades += stats.shortTrades;
            overallStats.longWins += stats.longWins;
            overallStats.longLosses += stats.longLosses;
            overallStats.shortWins += stats.shortWins;
            overallStats.shortLosses += stats.shortLosses;
            overallStats.totalPnl += stats.totalPnl;
            overallStats.longPnl += stats.longPnl;
            overallStats.shortPnl += stats.shortPnl;
        });
        
        overallStats.longWinRate = overallStats.longTrades > 0 ? parseFloat((overallStats.longWins / overallStats.longTrades * 100).toFixed(2)) : 0;
        overallStats.shortWinRate = overallStats.shortTrades > 0 ? parseFloat((overallStats.shortWins / overallStats.shortTrades * 100).toFixed(2)) : 0;
        overallStats.totalReturnRate = parseFloat((overallStats.totalPnl / 10000 * 100).toFixed(2));
        
        const finalResult = {
            summary: {
                years: Object.keys(result).sort(),
                overallStats,
                generatedAt: new Date().toISOString()
            },
            yearlyData: result
        };
        
        console.log(`正在写入结果文件: ${outputFilePath}`);
        fs.writeFileSync(outputFilePath, JSON.stringify(finalResult, null, 2), 'utf8');
        
        console.log('\n=== 转换完成 ===');
        console.log(`总交易数: ${overallStats.totalTrades}`);
        console.log(`多单: ${overallStats.longTrades} (胜率: ${overallStats.longWinRate}%)`);
        console.log(`空单: ${overallStats.shortTrades} (胜率: ${overallStats.shortWinRate}%)`);
        console.log(`总盈亏: ${overallStats.totalPnl.toFixed(2)} USDT`);
        console.log(`总收益率: ${overallStats.totalReturnRate}%`);
        
        return finalResult;
        
    } catch (error) {
        console.error('转换过程中出现错误:', error);
        throw error;
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('使用方法: node convert-trading-data.js <输入CSV文件> [输出JSON文件]');
        console.log('示例: node convert-trading-data.js origin-data/btc.json converted-data/btc-trades.json');
        return;
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || inputFile.replace('.csv', '-converted.json');
    
    if (!fs.existsSync(inputFile)) {
        console.error(`错误: 输入文件 ${inputFile} 不存在`);
        return;
    }
    
    try {
        const result = convertTradingData(inputFile, outputFile);
        console.log(`\n成功转换数据并保存到: ${outputFile}`);
    } catch (error) {
        console.error('转换失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { convertTradingData };