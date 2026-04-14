import { StrictMode } from 'react'
import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.jsx'
import './index.css'

export const createRoot = ViteReactSSG(
  { routes },
  ({ router, isClient, initialState }) => {
    // Custom setup logic if needed
  }
)
