export default async function handler(req, res) {
  const qIdx = req.url.indexOf('?')
  const qs = qIdx >= 0 ? req.url.slice(qIdx) : ''
  const target = 'https://hadithapi.com/public/api/hadiths/' + qs

  console.log('[hadith-proxy] →', target.replace(/apiKey=[^&]+/, 'apiKey=***'))

  try {
    const upstream = await fetch(target)
    const body = await upstream.text()
    console.log('[hadith-proxy] ←', upstream.status)
    res.statusCode = upstream.status
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.end(body)
  } catch (err) {
    console.error('[hadith-proxy] error', err)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: String(err) }))
  }
}
