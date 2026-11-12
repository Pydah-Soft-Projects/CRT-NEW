import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App.jsx'
import './index.css'

// Automatic domain redirection fallback: crt.pydahsoft.in -> crt.pydah.edu.in
if (typeof window !== 'undefined' && (window.location.hostname === 'crt.pydahsoft.in' || window.location.hostname === 'pydahsoft.in')) {
  window.location.replace('https://crt.pydah.edu.in' + window.location.pathname + window.location.search + window.location.hash);
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
) 