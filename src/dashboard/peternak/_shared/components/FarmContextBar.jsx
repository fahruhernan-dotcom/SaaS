import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePeternakFarms } from '@/lib/hooks/usePeternakData'
import { useAuth } from '@/lib/hooks/useAuth'

const LIVESTOCK_EMOJI = {
  ayam_broiler: '🐔',
  ayam_petelur: '🥚',
  domba: '🐑',
  kambing: '🐐',
  sapi: '🐄',
}

/**
 * Slim context bar shown at top of all Level-2 peternak pages.
 * Displays farm name + dropdown to switch farms (replaces :farmId in current path).
 *
 * @param {string} subPath  - the sub-route after the farmId, e.g. 'siklus', 'input', 'pakan'
 */
export default function FarmContextBar({ subPath }) {
  const { farmId }         = useParams()
  const navigate           = useNavigate()
  const [open, setOpen]    = useState(false)
  const { profile }        = useAuth()
  const { data: farms = [] } = usePeternakFarms()

  const peternakBase = `/peternak/${profile?.sub_type || 'peternak_broiler'}`

  const currentFarm = farms.find(f => f.id === farmId)

  const handleSwitch = (targetFarmId) => {
    setOpen(false)
    navigate(`${peternakBase}/kandang/${targetFarmId}/${subPath}`, { replace: true })
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(6,9,15,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Back to overview */}
      <button
        onClick={() => navigate(`${peternakBase}/beranda`)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4B6478', display: 'flex', alignItems: 'center', gap: 4, padding: 0, flexShrink: 0 }}
      >
        <ChevronLeft size={15} />
        <span style={{ fontSize: 12, fontFamily: 'DM Sans', fontWeight: 600 }}>Overview</span>
      </button>

      <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 14 }}>/</span>

      {/* Farm selector */}
      <div style={{ position: 'relative', flex: 1 }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 10, padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 14 }}>
            {LIVESTOCK_EMOJI[currentFarm?.livestock_type] ?? '🏚'}
          </span>
          <span style={{ fontFamily: 'Sora', fontSize: 13, fontWeight: 700, color: '#A78BFA', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentFarm?.farm_name ?? '...'}
          </span>
          <ChevronDown size={13} color="#A78BFA" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <AnimatePresence>
          {open && farms.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 100,
                marginTop: 4, minWidth: 200,
                background: '#0C1319',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {farms.map(farm => {
                const isActive = farm.id === farmId
                return (
                  <button
                    key={farm.id}
                    onClick={() => handleSwitch(farm.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: isActive ? 'rgba(124,58,237,0.1)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{LIVESTOCK_EMOJI[farm.livestock_type] ?? '🏚'}</span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#A78BFA' : '#F1F5F9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {farm.farm_name}
                    </span>
                    {isActive && <Check size={13} color="#A78BFA" />}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
