import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster 
        position="top-center" 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#111C24',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F1F5F9',
            borderRadius: '16px',
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
