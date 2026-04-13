const { onRequest } = require('firebase-functions/v2/https')
const https = require('https')
const { URL } = require('url')

/**
 * Proxy for hadithapi.com — forwards /hadith-api/** requests server-side
 * so the browser never hits hadithapi.com directly (CORS not supported there).
 *
 * Firebase Hosting rewrites /hadith-api/** to this function.
 * The original path arrives as req.path, e.g. /hadith-api/hadiths/
 */
exports.hadithProxy = onRequest({ cors: true }, (req, res) => {
  // Strip the /hadith-api prefix that Hosting passes through
  const apiPath = req.path.replace(/^\/hadith-api/, '') || '/'

  const target = new URL('https://hadithapi.com/public/api' + apiPath)

  // Forward all query params (apiKey, book, hadithNumber, etc.)
  for (const [k, v] of Object.entries(req.query)) {
    target.searchParams.set(k, String(v))
  }

  https.get(target.toString(), (proxyRes) => {
    res.set('Content-Type', 'application/json')
    res.status(proxyRes.statusCode || 200)
    proxyRes.pipe(res)
  }).on('error', (err) => {
    res.status(500).json({ error: err.message })
  })
})
