import React from 'react'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

const S = {
  label: { fontSize: 11, fontWeight: 700, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6, fontFamily: 'Sora' },
}

const TimePicker = ({ value, onChange, label, className }) => {
  // value format could be ISO "2024-03-16T14:30:00" or just "14:30"
  const getTimeString = () => {
    if (!value) return '08:00'
    if (value.includes('T')) return value.split('T')[1].substring(0, 5)
    return value
  }

  const timeStr = getTimeString()
  const [hour, minute] = timeStr.split(':')
  
  const handleHour = (h) => {
    const hh = String(Math.min(23, Math.max(0, h))).padStart(2, '0')
    const today = format(new Date(), 'yyyy-MM-dd')
    // If original value was HH:mm, keep it HH:mm. If it was ISO, keep it ISO.
    if (value && !value.includes('T')) {
        onChange(`${hh}:${minute || '00'}`)
    } else {
        onChange(`${today}T${hh}:${minute || '00'}:00+07:00`)
    }
  }
  
  const handleMinute = (m) => {
    const mm = String(Math.min(59, Math.max(0, m))).padStart(2, '0')
    const today = format(new Date(), 'yyyy-MM-dd')
    if (value && !value.includes('T')) {
        onChange(`${hour || '08'}:${mm}`)
    } else {
        onChange(`${today}T${hour || '08'}:${mm}:00+07:00`)
    }
  }
  
  return (
    <div className={className}>
      {label && <label style={S.label}>{label}</label>}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '16px',
        padding: '10px 14px',
        height: '56px'
      }}>
        <Clock size={15} color="#4B6478" style={{flexShrink: 0}} />
        
        <input
          type="number"
          min={0} max={23}
          value={hour}
          onChange={e => handleHour(parseInt(e.target.value) || 0)}
          className="w-10 bg-transparent border-none outline-none text-base font-black text-white text-center p-0"
        />
        
        <span className="text-lg font-bold text-[#4B6478] mb-0.5">:</span>
        
        <input
          type="number"
          min={0} max={59}
          value={minute}
          onChange={e => handleMinute(parseInt(e.target.value) || 0)}
          className="w-10 bg-transparent border-none outline-none text-base font-black text-white text-center p-0"
        />
        
        <div className="ml-auto flex flex-col gap-1">
          <button
            type="button"
            onClick={() => handleHour(parseInt(hour) + 1)}
            className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[#4B6478] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
          >
            <ChevronUp size={12} strokeWidth={3} />
          </button>
          <button
            type="button"
            onClick={() => handleHour(parseInt(hour) - 1)}
            className="w-5 h-5 rounded-md bg-white/5 border border-white/5 flex items-center justify-center text-[#4B6478] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
          >
            <ChevronDown size={12} strokeWidth={3} />
          </button>
        </div>
      </div>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}

export { TimePicker }
