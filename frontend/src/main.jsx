import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Global Axios interceptor to rewrite the hardcoded base URL in production
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://127.0.0.1:8000')) {
    if (import.meta.env.PROD) {
      config.url = config.url.replace('http://127.0.0.1:8000', window.location.origin);
    }
  }
  return config;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
