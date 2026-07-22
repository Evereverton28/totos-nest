import axios from 'axios'

// Base URL: empty string uses the Vite dev proxy; in production set VITE_API_URL.
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
})

// Attach the JWT (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tn_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear the stale token so the UI drops back to logged-out state.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) localStorage.removeItem('tn_token')
    return Promise.reject(err)
  }
)

export default api
