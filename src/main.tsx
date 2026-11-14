import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Choose before importing the account application: demo mode never initializes Firebase.
const isDemo = new URLSearchParams(window.location.search).get('demo') === '1'
const App = isDemo
  ? lazy(() => import('./demo/DemoApp'))
  : lazy(() => import('./App'))

// Keep the account application's offline support; a guest visit does not install its cache.
if (!isDemo && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(console.error)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p className="p-6" role="status">Loading Nimaaz…</p>}>
      <App />
    </Suspense>
  </StrictMode>,
)
