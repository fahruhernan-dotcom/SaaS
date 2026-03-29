import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: fullPage ? '100vh' : '200px',
      width: '100%',
      background: fullPage ? '#06090F' : 'transparent',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(16,185,129,0.1)',
          borderTop: '3px solid #10B981',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
