import https from 'node:https'

export default function handler(req, res) {
  const qIdx = req.url.indexOf('?')
  const qs = qIdx >= 0 ? req.url.slice(qIdx) : ''
  const target = 'https://hadithapi.com/public/api/hadiths/' + qs

  console.log('[hadith-proxy] →', target.replace(/apiKey=[^&]+/, 'apiKey=***'))

  https
    .get(target, (proxyRes) => {
      console.log('[hadith-proxy] ←', proxyRes.statusCode)
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json')
      res.statusCode = proxyRes.statusCode || 200
      proxyRes.pipe(res)
    })
    .on('error', (err) => {
      console.error('[hadith-proxy] upstream error', err)
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message }))
    })
}
