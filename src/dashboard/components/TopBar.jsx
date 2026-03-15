import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { motion } from 'framer-motion'

export default function TopBar({ title, subtitle, showBack = false, rightAction }) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(6,9,15,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: '60px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} color="#94A3B8" />
          </motion.button>
        )}
        <div>
          <div style={{
            fontFamily: 'Sora',
            fontSize: '16px',
            fontWeight: 700,
            color: '#F1F5F9',
            lineHeight: 1.2,
          }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#4B6478', marginTop: '2px' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {rightAction && rightAction}
    </div>
  )
}
