import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../api/client'

// Stable per-browser visitor id + per-tab session id.
function getVisitorId() {
  let id = localStorage.getItem('tn_visitor')
  if (!id) { id = 'v_' + Math.random().toString(36).slice(2); localStorage.setItem('tn_visitor', id) }
  return id
}
function getSessionId() {
  let id = sessionStorage.getItem('tn_session')
  if (!id) { id = 's_' + Math.random().toString(36).slice(2); sessionStorage.setItem('tn_session', id) }
  return id
}

// Fire-and-forget event tracker used by the funnel (add_to_cart, etc.)
export function trackEvent(event, meta = null) {
  api.post('/track', {
    session_id: getSessionId(), visitor_id: getVisitorId(),
    path: window.location.pathname, referrer: document.referrer,
    event, meta,
  }).catch(() => {})
}

// Records a pageview on every route change. Mounted once in App.
export function usePageTracking() {
  const location = useLocation()
  useEffect(() => { trackEvent('pageview') }, [location.pathname])
}
