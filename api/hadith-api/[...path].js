const https = require('https')

module.exports = (req, res) => {
  const segments = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path].filter(Boolean)
  const apiPath = '/' + segments.join('/')

  const target = new URL('https://hadithapi.com/public/api' + apiPath)
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    target.searchParams.set(k, String(v))
  }

  https
    .get(target.toString(), (proxyRes) => {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = proxyRes.statusCode || 200
      proxyRes.pipe(res)
    })
    .on('error', (err) => {
      res.statusCode = 502
      res.json({ error: err.message })
    })
}
