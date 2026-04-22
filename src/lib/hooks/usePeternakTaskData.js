import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { supabase } from '../supabase'
import { useAuth } from './useAuth'
import { toast } from 'sonner'
import { TEMPLATE_150_HARI, TEMPLATE_180_HARI } from '../constants/sapiTaskTemplates'
import { TEMPLATE_DOMBA_PENGGEMUKAN_90, TEMPLATE_DOMBA_INTENSIF_90 } from '../constants/taskTemplates/dombaTaskTemplates'

/**
 * Hook mirror: useSapiPenggemukanData.js
 * Pattern: React Query v5, tenant isolation, sonner toast
 */

// ─── QUERY HOOKS ──────────────────────────────────────────────────────────────

/**
 * Fetch task templates for the current tenant.
 * Decoupled from batch-specific kandang records via kandang_name (TEXT).
 */
export function usePeternakTaskTemplates(filters = {}) {
  const { tenant } = useAuth()
  const { kandangName, livestockType } = filters

  return useQuery({
    queryKey: ['peternak-task-templates', tenant?.id, kandangName, livestockType],
    queryFn: async () => {
      let query = supabase
        .from('peternak_task_templates')
        .select(`
          *,
          assignee:kandang_workers!default_assignee_worker_id(id, full_name, profile_id)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (kandangName) query = query.eq('kandang_name', kandangName)
      if (livestockType) query = query.eq('livestock_type', livestockType)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

/**
 * Fetch task instances with dynamic filters.
 */
export function usePeternakTaskInstances(filters = {}) {
  const { tenant } = useAuth()
  const { due_date_from, due_date_to, status, kandangName, workerProfileId, livestockType } = filters

  return useQuery({
    queryKey: ['peternak-task-instances', tenant?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from('peternak_task_instances')
        .select(`
          *,
          template:peternak_task_templates(title, task_type, recurring_type),
          worker:kandang_workers!assigned_worker_id(id, full_name, profile_id),
          assigned_profile:profiles!assigned_profile_id(id, full_name),
          completed_by:profiles!completed_by_profile_id(id, full_name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: true })

      if (due_date_from) query = query.gte('due_date', due_date_from)
      if (due_date_to) query = query.lte('due_date', due_date_to)
      if (status) query = query.eq('status', status)
      if (kandangName) query = query.eq('kandang_name', kandangName)
      if (livestockType) query = query.eq('livestock_type', livestockType)

      if (workerProfileId) {
        // Fetch worker record first to get the ID (to avoid complex cross-table OR filters that cause 400 errors)
        const { data: workerData } = await supabase
          .from('kandang_workers')
          .select('id')
          .eq('profile_id', workerProfileId)
          .eq('tenant_id', tenant.id)
          .maybeSingle()
          
        if (workerData?.id) {
          // Check both: assigned directly to profile OR assigned to their worker record (Template style)
          // NO SPACES in the OR string to prevent PostgREST parsing errors
          query = query.or(`assigned_profile_id.eq.${workerProfileId},assigned_worker_id.eq.${workerData.id}`)
        } else {
          query = query.eq('assigned_profile_id', workerProfileId)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

/**
 * Specialized wrapper for today's tasks.
 */
export function useTodayTaskInstances() {
  const today = new Date().toISOString().split('T')[0]
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['peternak-task-instances-today', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peternak_task_instances')
        .select(`
          *,
          template:peternak_task_templates(title, task_type, recurring_type),
          worker:kandang_workers!assigned_worker_id(id, full_name, profile_id)
        `)
        .eq('tenant_id', tenant.id)
        .eq('due_date', today)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

/**
 * In-progress timbang tasks from past dates (multi-day weighing carryover).
 */
export function useInProgressTimbangCarryover() {
  const today = new Date().toISOString().split('T')[0]
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['peternak-task-instances-timbang-carryover', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peternak_task_instances')
        .select(`
          *,
          template:peternak_task_templates(title, task_type, recurring_type),
          worker:kandang_workers!assigned_worker_id(id, full_name, profile_id),
          assigned_profile:profiles!assigned_profile_id(id, full_name),
          completed_by:profiles!completed_by_profile_id(id, full_name)
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'in_progress')
        .eq('task_type', 'timbang')
        .lt('due_date', today)
        .eq('is_deleted', false)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

/**
 * Specialized hook for a worker's assigned pending tasks.
 */
export function useMyTaskInstances(profileId) {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['peternak-task-instances-mine', tenant?.id, profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('peternak_task_instances')
        .select(`
          *,
          template:peternak_task_templates(title, task_type, recurring_type)
        `)
        .eq('tenant_id', tenant.id)
        .eq('assigned_profile_id', profileId)
        .in('status', ['pending', 'in_progress', 'terlambat', 'selesai'])
        .eq('is_deleted', false)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id && !!profileId,
  })
}


// ─── MUTATION HOOKS ───────────────────────────────────────────────────────────

/**
 * Create a new task template.
 * Creating/updating a template automatically triggers instance generation via DB trigger.
 */
export function useCreateTaskTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (payload) => {
      const { error } = await supabase
        .from('peternak_task_templates')
        .insert({
          tenant_id: tenant.id,
          ...payload
        })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Template tugas berhasil dibuat')
    },
    onError: (err) => toast.error('Gagal membuat template: ' + err.message)
  })
}

/**
 * Update an existing task template.
 */
export function useUpdateTaskTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { error } = await supabase
        .from('peternak_task_templates')
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Template diperbarui')
    },
    onError: (err) => toast.error('Gagal update template: ' + err.message)
  })
}

/**
 * Soft delete multiple task templates.
 */
export function useBulkDeleteTaskTemplates() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (ids) => {
      if (!ids?.length) return
      
      // 1. Soft delete templates
      const { error: errTemplate } = await supabase
        .from('peternak_task_templates')
        .update({ is_deleted: true, is_active: false })
        .in('id', ids)
        .eq('tenant_id', tenant.id)
      if (errTemplate) throw errTemplate

      // 2. Soft delete associated uncompleted instances
      const { error: errInstance } = await supabase
        .from('peternak_task_instances')
        .update({ is_deleted: true })
        .in('template_id', ids)
        .eq('tenant_id', tenant.id)
        .neq('status', 'selesai')
      
      if (errInstance) throw errInstance
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Beberapa template berhasil dihapus')
    },
    onError: (err) => toast.error('Gagal menghapus template: ' + err.message)
  })
}

/**
 * Soft delete a task template.
 */
export function useDeleteTaskTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (id) => {
      // 1. Soft delete template
      const { error: errTemplate } = await supabase
        .from('peternak_task_templates')
        .update({ is_deleted: true, is_active: false })
        .eq('id', id)
        .eq('tenant_id', tenant.id)
      if (errTemplate) throw errTemplate

      // 2. Soft delete associated uncompleted instances
      const { error: errInstance } = await supabase
        .from('peternak_task_instances')
        .update({ is_deleted: true })
        .eq('template_id', id)
        .eq('tenant_id', tenant.id)
        .neq('status', 'selesai')

      if (errInstance) throw errInstance
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Template dihapus')
    },
    onError: (err) => toast.error('Gagal menghapus template: ' + err.message)
  })
}

/**
 * Create an ad-hoc task instance (not from a template).
 */
export function useCreateTaskInstance() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (payload) => {
      const toInsert = Array.isArray(payload)
        ? payload.map(p => ({ tenant_id: tenant.id, ...p }))
        : { tenant_id: tenant.id, ...payload }

      const { error } = await supabase
        .from('peternak_task_instances')
        .insert(toInsert)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances-today', tenant?.id] })
      toast.success('Tugas ad-hoc berhasil ditambahkan')
    },
    onError: (err) => toast.error('Gagal membuat tugas: ' + err.message)
  })
}

/**
 * Update task instance status.
 * Handles completion timestamps and metadata.
 */
export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  const { tenant, profile } = useAuth()

  return useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const payload = {
        status,
        notes,
        updated_at: new Date().toISOString()
      }

      if (status === 'selesai') {
        payload.completed_at = new Date().toISOString()
        payload.completed_by_profile_id = profile?.profile_id ?? profile?.id
      }

      const { error } = await supabase
        .from('peternak_task_instances')
        .update(payload)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances-today', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances-mine'] })
      toast.success('Status tugas diperbarui')
    },
    onError: (err) => toast.error('Gagal update status: ' + err.message)
  })
}

/**
 * Link a task instance to a data record (e.g. weight record ID).
 */
export function useLinkTaskRecord() {
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async ({ id, linked_record_id, linked_record_table }) => {
      const { error } = await supabase
        .from('peternak_task_instances')
        .update({ linked_record_id, linked_record_table })
        .eq('id', id)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    }
  })
}

/**
 * Trigger manual instance generation or force refresh.
 * Note: DB trigger already handles auto-generation, this is for edge cases or forcing 30-day expansion.
 */
export function useGenerateInstancesFromTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async (templateId) => {
      // Force a trigger execution by updating the updated_at timestamp
      const { error } = await supabase
        .from('peternak_task_templates')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', templateId)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Jadwal tugas dikembangkan')
    },
    onError: (err) => toast.error('Gagal mengembangkan jadwal: ' + err.message)
  })
}

/**
 * Apply a TernakOS default task template package to a kandang.
 * Converts phase offsets to absolute dates using batchStartDate, then bulk-inserts
 * all template rows. DB trigger auto-generates instances for the next 30 days.
 */
export function useApplySapiTaskTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async ({ templateType, batchStartDate, kandangName }) => {
      const templates = templateType === '150' ? TEMPLATE_150_HARI : TEMPLATE_180_HARI
      const baseDate = new Date(batchStartDate)

      const rows = templates.map(t => ({
        tenant_id: tenant.id,
        kandang_name: kandangName,
        livestock_type: 'sapi_penggemukan',
        title: t.title,
        description: t.description,
        task_type: t.task_type,
        recurring_type: t.recurring_type,
        recurring_days_of_week: t.recurring_days_of_week,
        recurring_interval_days: t.recurring_interval_days,
        due_time: t.due_time,
        linked_data_entry: t.linked_data_entry,
        start_date: format(addDays(baseDate, t.phase_start_offset), 'yyyy-MM-dd'),
        end_date: format(addDays(baseDate, t.phase_end_offset), 'yyyy-MM-dd'),
        is_active: true,
        is_deleted: false,
      }))

      const { error } = await supabase
        .from('peternak_task_templates')
        .insert(rows)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Template TernakOS berhasil diterapkan!')
    },
    onError: (err) => toast.error('Gagal menerapkan template: ' + err.message),
  })
}

/**
 * Apply a Domba task template package.
 */
export function useApplyDombaTaskTemplate() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async ({ templateType, batchStartDate, kandangName }) => {
      // Map '90' to intensive if it's the package applied
      const templates = templateType === '90' ? TEMPLATE_DOMBA_INTENSIF_90 : TEMPLATE_DOMBA_PENGGEMUKAN_90
      const baseDate = new Date(batchStartDate)

      const rows = templates.map(t => ({
        tenant_id: tenant.id,
        kandang_name: kandangName,
        livestock_type: 'domba_penggemukan',
        title: t.title,
        description: t.description,
        task_type: t.task_type,
        recurring_type: t.recurring_type,
        recurring_days_of_week: t.recurring_days_of_week,
        recurring_interval_days: t.recurring_interval_days,
        due_time: t.due_time,
        linked_data_entry: t.linked_data_entry,
        start_date: format(addDays(baseDate, t.phase_start_offset), 'yyyy-MM-dd'),
        end_date: format(addDays(baseDate, t.phase_end_offset), 'yyyy-MM-dd'),
        is_active: true,
        is_deleted: false,
      }))

      const { error } = await supabase
        .from('peternak_task_templates')
        .insert(rows)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peternak-task-templates', tenant?.id] })
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success('Template TernakOS Domba berhasil diterapkan!')
    },
    onError: (err) => toast.error('Gagal menerapkan template: ' + err.message),
  })
}

/**
 * Update the assigned worker on a task instance (drag-and-drop assignment).
 * No success toast — UI is optimistic; failure will show error.
 */
export function useUpdateTaskAssignment() {
  const qc = useQueryClient()
  const { tenant } = useAuth()

  return useMutation({
    mutationFn: async ({ id, assigned_worker_id, assigned_profile_id }) => {
      const { error } = await supabase
        .from('peternak_task_instances')
        .update({ assigned_worker_id, assigned_profile_id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenant.id)
      if (error) throw error
    },
    onSuccess: (_, { id, assigned_worker_id, assigned_profile_id }) => {
      // Update cache langsung — tidak ada refetch, tidak ada bounce
      qc.setQueriesData(
        { queryKey: ['peternak-task-instances', tenant?.id] },
        (old) => {
          if (!Array.isArray(old)) return old
          return old.map(task =>
            task.id === id ? { ...task, assigned_worker_id, assigned_profile_id } : task
          )
        }
      )
    },
    onError: (err) => toast.error('Gagal simpan penugasan: ' + err.message),
  })
}

/**
 * Fetch workers for task assignment.
 */
export function useKandangWorkers() {
  const { tenant } = useAuth()
  return useQuery({
    queryKey: ['kandang-workers', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kandang_workers')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'aktif')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!tenant?.id,
  })
}

/**
 * Fetch team members from profiles that can be assigned tasks.
 * Returns profile rows shaped as { id, full_name, role, profile_id: id }
 * so TaskAssign can use them interchangeably with kandang_workers shape.
 */
export function useAssignableMembers() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: ['assignable-members', profile?.tenant_id],
    queryFn: async () => {
      const [{ data: profilesData, error }, { data: memberships }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, auth_user_id, full_name, role')
          .eq('tenant_id', profile.tenant_id)
          .neq('role', 'owner'),
        supabase
          .from('tenant_memberships')
          .select('auth_user_id, full_name, role')
          .eq('tenant_id', profile.tenant_id)
          .neq('role', 'owner'),
      ])
      if (error) throw error

      const membershipMap = new Map(
        (memberships ?? []).map(m => [m.auth_user_id, m])
      )

      return (profilesData ?? [])
        .map(p => {
          if (!p.full_name && p.auth_user_id) {
            const m = membershipMap.get(p.auth_user_id)
            if (m?.full_name) p = { ...p, full_name: m.full_name }
          }
          return { ...p, profile_id: p.id }
        })
        .filter(p => p.full_name)
        .sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''))
    },
    enabled: !!profile?.tenant_id,
  })
}

/**
 * Bulk auto-assign tasks across multiple days using load balancing.
 */
export function useAutoAssignBatch() {
  const qc = useQueryClient()
  const { tenant } = useAuth()
  
  return useMutation({
    mutationFn: async ({ startDate, endDate, workers, action = 'auto' }) => {
      if (!workers?.length && action !== 'reset') throw new Error('Tidak ada anggota tim yang tersedia')
      
      const { data: dbTasks, error: errFetch } = await supabase
        .from('peternak_task_instances')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .not('status', 'eq', 'selesai')
      
      if (errFetch) throw errFetch
      if (dbTasks.length === 0) return 0

      const updates = []

      if (action === 'reset') {
        // RESET MODE: Unassign all
        const assignedTasks = dbTasks.filter(t => t.assigned_worker_id || t.assigned_profile_id)
        if (assignedTasks.length === 0) return 0
        for (const t of assignedTasks) {
          updates.push({ ...t, assigned_profile_id: null, assigned_worker_id: null, updated_at: new Date().toISOString() })
        }
      } else {
        // AUTO or REBALANCE MODE
        const toAssign = action === 'rebalance' 
          ? [...dbTasks].sort(() => Math.random() - 0.5) // Rebalance takes all tasks and shuffles
          : dbTasks.filter(t => !t.assigned_worker_id && !t.assigned_profile_id).sort((a,b) => `${a.due_date}${a.due_time}`.localeCompare(`${b.due_date}${b.due_time}`))
        
        if (toAssign.length === 0) return 0

        const loadMap = new Map(workers.map(w => [w.profile_id ?? w.id, 0]))
        const sortedWorkers = [...workers].sort((a, b) => a.full_name.localeCompare(b.full_name))
        
        if (action === 'auto') {
          // If auto, keep existing load into account
          for (const t of dbTasks) {
            const pId = t.assigned_profile_id
            if (pId && loadMap.has(pId)) loadMap.set(pId, loadMap.get(pId) + 1)
          }
        }
        // If rebalance, everyone starts at 0 load, and ALL tasks are re-assigned fairly

        for (const t of toAssign) {
          const worker = sortedWorkers.reduce((best, w) => {
            const l1 = loadMap.get(best.profile_id ?? best.id) ?? 0
            const l2 = loadMap.get(w.profile_id ?? w.id) ?? 0
            return l2 < l1 ? w : best
          })
          const pId = worker.profile_id ?? worker.id
          loadMap.set(pId, (loadMap.get(pId) ?? 0) + 1)
          // Ensure we clear legacy assigned_worker_id as well
          updates.push({ ...t, assigned_profile_id: pId, assigned_worker_id: null, updated_at: new Date().toISOString() })
        }
      }

      if (updates.length > 0) {
        for (let i = 0; i < updates.length; i += 100) {
           const chunk = updates.slice(i, i + 100)
           const { error: errUp } = await supabase.from('peternak_task_instances').upsert(chunk)
           if (errUp) throw errUp
        }
      }
      return updates.length
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['peternak-task-instances'] })
      toast.success(`Berhasil membagi rata ${count} tugas yang belum ter-assign`)
    },
    onError: (err) => toast.error('Gagal Auto-Assign: ' + err.message)
  })
}
