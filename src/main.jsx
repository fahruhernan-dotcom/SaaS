import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.jsx'
import './index.css'

export const createRoot = ViteReactSSG(
  { routes },
  () => {
    // SSG-safe: only run global error capture in the browser
    if (typeof window === 'undefined') return

    import('@/lib/logger/errorLogger').then(({ logError }) => {
      window.onerror = (msg, src, line, col, error) => {
        logError({
          level: 'error',
          source: 'frontend',
          error: error || { message: String(msg), code: null, stack: null, details: null },
          metadata: { src, line, col },
        })
      }

      window.onunhandledrejection = (event) => {
        const reason = event?.reason
        logError({
          level: 'error',
          source: 'unhandled_rejection',
          error: reason instanceof Error
            ? reason
            : { message: String(reason ?? 'Unhandled promise rejection'), code: null, stack: null, details: null },
          metadata: {},
        })
      }
    })
  }
)
