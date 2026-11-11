import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Cloudflare Web Analytics (no cookies). Loaded only in the production build
// and only when the site token is set as VITE_CF_ANALYTICS_TOKEN at build time.
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (import.meta.env.PROD && analyticsToken) {
  const beacon = document.createElement('script')
  beacon.defer = true
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: analyticsToken }))
  document.head.appendChild(beacon)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
