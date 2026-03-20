import React, { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export function InputNumber({
  value,
  onChange,
  step = 1,
  min,
  max,
  placeholder = '0',
  suffix,
  className = '',
  ...props
}) {
  const [displayVal, setDisplayVal] = useState('')

  useEffect(() => {
    if (value === null || value === undefined || value === '') {
      setDisplayVal('')
      return
    }

    const rawDisplay = displayVal.replace(/\./g, '').replace(/,/g, '.')
    const currentNum = parseFloat(rawDisplay)

    // Sync from props if mismatch (allow trailing commas/zeros while typing)
    if (isNaN(currentNum) || currentNum !== value) {
      if (rawDisplay.endsWith('.') || (rawDisplay.includes('.') && rawDisplay.endsWith('0') && currentNum === value)) {
        return
      }
      const parts = value.toString().split('.')
      const intPart = parseInt(parts[0], 10).toLocaleString('id-ID')
      const decPart = parts.length > 1 ? ',' + parts[1] : ''
      setDisplayVal(intPart + decPart)
    }
  }, [value])

  const handleChange = (e) => {
    let raw = e.target.value

    if (raw === '') {
      setDisplayVal('')
      onChange('')
      return
    }

    raw = raw.replace(/[^\d,]/g, '')
    const commaSplit = raw.split(',')
    if (commaSplit.length > 2) {
      raw = commaSplit[0] + ',' + commaSplit.slice(1).join('')
    }

    const intPartRaw = commaSplit[0]
    const decPartRaw = commaSplit.length > 1 ? commaSplit[1] : undefined

    let parsedInt = parseInt(intPartRaw, 10)
    let newDisplay = ''
    if (!isNaN(parsedInt)) {
      newDisplay = parsedInt.toLocaleString('id-ID')
    }

    if (decPartRaw !== undefined) {
      newDisplay += ',' + decPartRaw
    }

    setDisplayVal(newDisplay)

    const numericStr = raw.replace(/,/g, '.')
    const numericVal = parseFloat(numericStr)
    if (!isNaN(numericVal)) {
      onChange(numericVal)
    }
  }
  const handleUp = () => {
    const current = parseFloat(value) || 0
    const next = current + step
    if (max === undefined || next <= max) {
      onChange(parseFloat(next.toFixed(10)))
    }
  }

  const handleDown = () => {
    const current = parseFloat(value) || 0
    const next = current - step
    if (min === undefined || next >= min) {
      onChange(parseFloat(next.toFixed(10)))
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      
      {/* Input */}
      <input
        type="text"
        inputMode="decimal"
        value={displayVal}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          padding: suffix ? '13px 48px 13px 38px' : '13px 48px 13px 14px',
          background: 'hsl(var(--input))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '10px',
          fontSize: '16px',
          color: 'inherit',
          outline: 'none',
          MozAppearance: 'textfield',
        }}
        className={`focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 ${className}`}
        {...props}
      />
      
      {/* Suffix label if any (left-side but with extra padding) */}
      {suffix && (
        <span style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '13px',
          color: 'hsl(var(--muted-foreground))',
          pointerEvents: 'none',
          userSelect: 'none',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
          {suffix}
        </span>
      )}
      
      {/* Custom spinner buttons */}
      <div style={{
        position: 'absolute',
        right: '1px',
        top: '1px',
        bottom: '1px',
        width: '36px',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid hsl(var(--border))',
        borderRadius: '0 9px 9px 0',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)'
      }}>
        {/* Up button */}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); handleUp() }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.10)'
            e.currentTarget.style.color = '#34D399'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
          }}
        >
          <ChevronUp size={11} strokeWidth={2.5} />
        </button>
        
        {/* Down button */}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); handleDown() }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--muted-foreground))',
            transition: 'background 0.1s, color 0.1s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(16,185,129,0.10)'
            e.currentTarget.style.color = '#34D399'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
          }}
        >
          <ChevronDown size={11} strokeWidth={2.5} />
        </button>
      </div>
      
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
