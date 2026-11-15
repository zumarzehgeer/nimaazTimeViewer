import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, sep, extname } from 'node:path'

const root = resolve('.test-builds')
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' }
createServer((request, response) => {
  const current = existsSync(resolve(root, 'serve-current'))
  const mode = current ? 'current' : 'previous'
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
  const base = resolve(root, mode)
  let file = resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(base + sep)) { response.writeHead(403).end(); return }
  // Keep old hashed assets reachable while a previous tab is still open.
  if (!existsSync(file) && current && pathname.startsWith('/assets/')) file = resolve(root, 'previous', '.' + pathname)
  if (!existsSync(file)) { response.writeHead(404).end(); return }
  response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' })
  response.end(readFileSync(file))
}).listen(4174, '127.0.0.1')
