const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export default async function handler(req, res) {
  const qIdx = req.url.indexOf('?')
  const qs = qIdx >= 0 ? req.url.slice(qIdx) : ''
  const target = 'https://hadithapi.com/public/api/hadiths/' + qs

  console.log('[hadith-proxy] →', target.replace(/apiKey=[^&]+/, 'apiKey=***'))

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, */*;q=0.5',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://hadithapi.com/',
      },
    })
    const body = await upstream.text()
    console.log(
      '[hadith-proxy] ←',
      upstream.status,
      upstream.status >= 400 ? `body: ${body.slice(0, 500)}` : `${body.length} bytes`,
    )
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
