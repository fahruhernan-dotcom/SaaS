import React from 'react'

export default function LoadingScreen() {
  return (
    <div style={{
      background: '#06090F',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      position: 'fixed',
      inset: 0,
      zIndex: 9999
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '24px', height: '24px', background: '#10B981', borderRadius: '6px' }} />
        <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '20px', color: '#F1F5F9' }}>
          TernakOS
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              animation: `dot-pulse 1.4s ease-in-out ${delay}s infinite`
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes dot-pulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  )
}
