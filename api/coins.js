const fs = require('fs')
const path = require('path')

module.exports = (req, res) => {
  try {
    const dir = path.join(process.cwd(), 'converted-data')
    const files = fs.readdirSync(dir)
    const coins = files
      .filter(f => f.endsWith('-trades.json'))
      .map(f => f.replace('-trades.json', ''))
      .sort()
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 200
    res.end(JSON.stringify({ coins }))
  } catch (e) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'failed', message: e.message }))
  }
}