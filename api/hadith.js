const https = require('https')

module.exports = (req, res) => {
  const target = new URL('https://hadithapi.com/public/api/hadiths/')
  for (const [k, v] of Object.entries(req.query)) {
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
