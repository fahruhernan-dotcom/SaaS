import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import './index.css'
import { TooltipProvider } from './components/ui/tooltip'
import { NotificationsProvider } from './lib/hooks/useNotifications.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </TooltipProvider>
      <Toaster 
        theme="dark"
        position="top-center" 
        richColors 
        expand={false}
        duration={3000}
        toastOptions={{
          style: {
            background: '#111C24',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#F1F5F9',
            fontFamily: 'DM Sans',
            fontSize: '14px',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          classNames: {
            success: 'border-emerald-500/20',
            error: 'border-red-500/20',
          }
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
