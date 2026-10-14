// Throwaway static server used only to verify the exported `out/` directory.
const http = require('http')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'out')
const port = Number(process.argv[2] || 4322)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0])
    let file = path.join(root, url)
    if (!file.startsWith(root)) {
      res.writeHead(403).end('forbidden')
      return
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
    if (!fs.existsSync(file)) file = path.join(root, '404.html')

    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404).end('not found')
        return
      }
      res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' })
      res.end(data)
    })
  })
  .listen(port, () => console.log(`serving out/ on http://localhost:${port}`))
