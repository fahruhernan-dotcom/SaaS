import { format, differenceInHours, isBefore } from 'date-fns'

/**
 * Calculates urgency label for a task based on due date and time
 */
export function getUrgencyLabel(task) {
  if (task.status === 'selesai' || task.status === 'dilewati') return null
  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  if (task.due_date !== todayStr) return null
  if (!task.due_time) return { label: 'HARI INI', color: 'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30 shadow-lg shadow-purple-900/20' }
  const [h, m, s] = task.due_time.split(':')
  const dueDateTime = new Date(now)
  dueDateTime.setHours(parseInt(h), parseInt(m), parseInt(s))
  const diffHours = differenceInHours(dueDateTime, now)
  if (isBefore(dueDateTime, now)) return { label: 'MENDESAK', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-lg shadow-rose-900/20' }
  if (diffHours <= 2) return { label: 'SEGERA', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-900/20' }
  return { label: 'HARI INI', color: 'bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30 shadow-lg shadow-purple-900/20' }
}

/**
 * Helper to determine if a task is overdue (terlambat) based on status, date, or time
 */
export function isOverdueTask(task) {
  if (task.status === 'selesai' || task.status === 'dilewati') return false
  if (task.status === 'terlambat') return true

  const now = new Date()
  const todayStr = format(now, 'yyyy-MM-dd')
  if (task.due_date < todayStr) return true

  if (task.due_date === todayStr && task.due_time) {
    const [h, m, s] = task.due_time.split(':')
    const dueDateTime = new Date(now)
    dueDateTime.setHours(parseInt(h, 10), parseInt(m, 10), parseInt(s || 0, 10))
    if (isBefore(dueDateTime, now)) return true
  }

  return false
}

/**
 * Common task sorting logic
 */
export function sortTasksByPriority(tasks) {
  const getPriority = (t) => {
    if (isOverdueTask(t)) return 0
    if (t.status === 'in_progress') return 1
    if (t.status === 'pending') return 2
    return 3
  }
  return [...tasks].sort((a, b) => {
    const pA = getPriority(a)
    const pB = getPriority(b)
    if (pA !== pB) return pA - pB
    
    // Sort by due date first
    if (a.due_date !== b.due_date) {
      return a.due_date.localeCompare(b.due_date)
    }
    // Sort by due time second
    if (a.due_time && b.due_time) {
      return a.due_time.localeCompare(b.due_time)
    }
    return 0
  })
}

/**
 * Gets a randomized sample of animals based on a seed (e.g. date + batch_id)
 */
export function getRandomizedSample(animals, seed, percentage = 0.1) {
  if (!animals || animals.length === 0) return []
  const sampleSize = Math.max(1, Math.ceil(animals.length * percentage))
  // Simple deterministic shuffle using seed
  const seededRandom = (s) => {
    const mask = 0xffffffff
    let m_w = (123456789 + s) & mask
    let m_z = (987654321 - s) & mask
    return () => {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask
      let result = ((m_z << 16) + (m_w & 65535)) >>> 0
      result /= 4294967296
      return result
    }
  }
  const stringToSeed = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return hash
  }
  const rng = seededRandom(stringToSeed(seed))
  const shuffled = [...animals].sort(() => rng() - 0.5)
  return shuffled.slice(0, sampleSize)
}
