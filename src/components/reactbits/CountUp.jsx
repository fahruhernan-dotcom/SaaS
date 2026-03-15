import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useTransform, animate } from 'framer-motion'

function CountUp({
  from = 0,
  to,
  separator = '',
  direction = 'up',
  duration = 1.5,
  className = '',
  onStart,
  onEnd,
  prefix = '',
  suffix = '',
  style = {},
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const count = useMotionValue(direction === 'down' ? to : from)
  const [displayValue, setDisplayValue] = useState(
    direction === 'down' ? to : from
  )

  useEffect(() => {
    if (!isInView) return
    if (onStart) onStart()
    
    const target = direction === 'down' ? from : to
    const controls = animate(count, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        const rounded = Math.round(v)
        const formatted = separator
          ? rounded.toLocaleString('id-ID')
          : String(rounded)
        setDisplayValue(formatted)
      },
      onComplete: () => { if (onEnd) onEnd() }
    })
    
    return controls.stop
  }, [isInView])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}

export default CountUp
