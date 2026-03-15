import { motion, AnimatePresence } from 'framer-motion'

export default function SlideModal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '480px',
              background: '#0C1319',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              zIndex: 201,
              maxHeight: '92vh',
              overflowY: 'auto',
              paddingBottom: 'env(safe-area-inset-bottom, 20px)',
            }}
          >
            {/* Handle */}
            <div style={{
              width: '36px', height: '4px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '99px',
              margin: '12px auto 0',
            }} />

            {/* Header */}
            {title && (
              <div style={{
                padding: '16px 20px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  fontFamily: 'Sora',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#F1F5F9',
                }}>
                  {title}
                </div>
              </div>
            )}

            <div style={{ padding: '20px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
