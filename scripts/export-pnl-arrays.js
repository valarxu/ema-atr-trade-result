const fs = require('fs');
const path = require('path');

function extractPnlPercents(csvText) {
  const lines = csvText.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (i === 0 && line.toLowerCase().includes('pnlpercent')) continue; // header
    const fields = [];
    const re = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      fields.push(m[1]);
    }
    if (fields.length >= 4) {
      const val = parseFloat(fields[3]);
      if (!Number.isNaN(val)) out.push(val);
    }
  }
  return out;
}

function main() {
  const base = process.cwd();
  const files = {
    btc: path.join(base, 'converted-data', 'btc-trades-compound.csv'),
    eth: path.join(base, 'converted-data', 'eth-trades-compound.csv'),
    sol: path.join(base, 'converted-data', 'sol-trades-compound.csv'),
  };
  const result = {};
  for (const [k, p] of Object.entries(files)) {
    if (!fs.existsSync(p)) {
      throw new Error('File not found: ' + p);
    }
    const txt = fs.readFileSync(p, 'utf8');
    result[k] = extractPnlPercents(txt);
  }
  const outPath = path.join(base, 'converted-data', 'pnl-percent-arrays.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('Written', outPath);
  for (const k of Object.keys(result)) {
    console.log(k.toUpperCase(), 'count=', result[k].length);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

