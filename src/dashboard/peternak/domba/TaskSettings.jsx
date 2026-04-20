import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { 
  Utensils, Scale, Syringe, Trash2, Activity, ClipboardList, 
  RefreshCcw, Settings2, Plus, Sparkles, Check, Users, Users2, PlusCircle, Lock 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

import { 
  usePeternakTaskTemplates, 
  useBulkDeleteTaskTemplates, 
  useCreateTaskTemplate, 
  useUpdateTaskTemplate, 
  useGenerateInstancesFromTemplate,
  useApplyDombaTaskTemplate,
  useKandangWorkers
} from '@/lib/hooks/usePeternakTaskData'
import { useAuth } from '@/lib/hooks/useAuth'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDombaBatches, useDombaActiveBatches } from '@/lib/hooks/useDombaPenggemukanData'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import EmptyState from '../../_shared/components/EmptyState'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { BrokerBaseCard } from '../../_shared/components/transactions/BrokerBaseCard'

const TASK_TYPE_CFG = {
  pemberian_pakan: { label: 'Pakan', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  pakan: { label: 'Pakan', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  timbang: { label: 'Timbang', icon: Scale, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
  vaksinasi: { label: 'Vaksin', icon: Syringe, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
  kebersihan: { label: 'Kebersihan', icon: Trash2, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/20' },
  kebersihan_kandang: { label: 'Kebersihan', icon: Trash2, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/20' },
  ceklis_kesehatan: { label: 'Kesehatan', icon: Activity, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
  kesehatan: { label: 'Kesehatan', icon: Activity, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
  wool_check: { label: 'Cek Wool', icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/20' },
  bcs_check: { label: 'BCS', icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20' },
  lainnya: { label: 'Lainnya', icon: ClipboardList, color: 'text-slate-400', bg: 'bg-white/10', border: 'border-white/10' },
}

const RECURRING_TYPES = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'dua_mingguan', label: '2 Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
  { value: 'custom', label: 'Kustom (Hari)' },
  { value: 'sekali', label: 'Sekali Saja' },
]

const DAYS = [
  { value: 1, label: 'Sen' },
  { value: 2, label: 'Sel' },
  { value: 3, label: 'Rab' },
  { value: 4, label: 'Kam' },
  { value: 5, label: 'Jum' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Min' },
]

function Checkbox({ checked, onCheckedChange, className }) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onCheckedChange(!checked); }}
      className={cn(
        "w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-200",
        checked 
          ? "bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
          : "bg-white/5 border-white/20 hover:border-white/40",
        className
      )}
    >
      {checked && <Check size={14} className="text-white" strokeWidth={4} />}
    </div>
  )
}

// ── LOCAL COMPONENTS ─────────────────────────────────────────────────────────

function SummaryStrip({ items = [] }) {
  return (
    <div className="bg-green-500/[0.04] border-b border-white/[0.04] px-5 py-4 flex flex-wrap gap-4 items-center overflow-x-auto no-scrollbar">
      {items.map((item, idx) => (
        <div key={item.label} className={cn("min-w-[140px] px-6 border-r border-white/5 last:border-0")}>
          <p className="font-black text-[#4B6478] uppercase tracking-widest leading-none mb-2 text-[9px]">
            {item.label}
          </p>
          <p className="font-['Sora'] font-black text-lg text-white tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function TemplateItemMobile({ template, onEdit, onDelete, isSelected, onToggleSelect }) {
  const cfg = TASK_TYPE_CFG[template.task_type] || TASK_TYPE_CFG.lainnya
  const refresh = useGenerateInstancesFromTemplate()
  const { profile } = useAuth()
  const isOwner = profile?.role === 'owner'
  const isProtected = template.title?.includes('Sampling') || 
                      template.title?.includes('Intensif') || 
                      template.title?.includes('Timbang Total (90 Hari)')
  const isLocked = isProtected && !isOwner

  return (
    <BrokerBaseCard 
      onClick={() => !isLocked && onEdit(template)}
      isDesktop={false}
      className={cn(
        "mb-4 bg-white/[0.02] border-white/[0.06] rounded-2xl p-4 transition-all duration-300",
        isSelected && "bg-green-500/5 border-green-500/30 scale-[0.98] shadow-inner",
        isLocked && "opacity-60 grayscale-[0.3]"
      )}
      header={
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onToggleSelect} 
            className="mr-1"
            disabled={isLocked}
          />
          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner", cfg.bg, cfg.border)}>
            <cfg.icon size={18} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-['Sora'] font-bold text-sm text-white truncate">{template.title}</h3>
              {isLocked && <Lock size={10} className="text-amber-500/50" />}
            </div>
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-wider mt-1">
              {template.recurring_type} • {template.kandang_name || 'Semua Kandang'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between mt-4 bg-white/[0.02] -mx-4 -mb-4 px-4 py-3 rounded-b-2xl border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-[#4B6478]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {template.assignee?.full_name?.split(' ')[0] || 'UNASSIGNED'}
            </span>
          </div>
          <div className="flex gap-2">
             {!isLocked && (
               <>
                 <Button 
                    variant="ghost" size="icon" className="h-8 w-8 text-red-500/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
                 >
                    <Trash2 size={14} />
                 </Button>
                 <Button 
                    variant="ghost" size="icon" className="h-8 w-8 text-green-500/30 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                    onClick={(e) => { e.stopPropagation(); refresh.mutate(template.id); }}
                    disabled={refresh.isPending}
                 >
                    <RefreshCcw size={14} className={refresh.isPending ? "animate-spin" : ""} />
                 </Button>
               </>
             )}
             {isLocked && (
               <div className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500/70 uppercase tracking-widest flex items-center gap-1">
                 <Lock size={8} /> Proyek Strategis
               </div>
             )}
          </div>
        </div>
      }
    />
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function DombaTaskSettings() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  
  const { profile } = useAuth()
  const { data: templates = [], isLoading } = usePeternakTaskTemplates()
  const bulkDelete = useBulkDeleteTaskTemplates()
  const refresh = useGenerateInstancesFromTemplate()

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates
    return templates.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.kandang_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [templates, searchQuery])

  const stats = useMemo(() => ([
    { label: 'Total Template', value: templates.length },
    { label: 'Template Aktif', value: templates.filter(t => t.is_active).length },
    { label: 'Input Data', value: templates.filter(t => t.linked_data_entry).length },
  ]), [templates])

  function handleEdit(template) {
    setSelectedTemplate(template)
    setSheetOpen(true)
  }

  function handleAddNew() {
    setSelectedTemplate(null)
    setSheetOpen(true)
  }

  function toggleSelection(id) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredTemplates.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTemplates.map(t => t.id)))
    }
  }

  function handleDeleteConfirm(id) {
    setTaskToDelete(id ? [id] : Array.from(selectedIds))
    setDeleteDialogOpen(true)
  }

  function performDelete() {
    if (!taskToDelete) return
    bulkDelete.mutate(taskToDelete, {
      onSuccess: () => {
        setSelectedIds(new Set())
        setDeleteDialogOpen(false)
        setTaskToDelete(null)
      }
    })
  }

  const { setRightAction } = useOutletContext()
  useEffect(() => {
    if (!isDesktop) {
      setRightAction(
        <button
          onClick={handleAddNew}
          className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
        >
          <Plus size={20} />
        </button>
      )
    } else {
      setRightAction(null)
    }
  }, [setRightAction, isDesktop])

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-100 pb-24 lg:pb-0 font-body">
      <BrokerPageHeader 
        title="Konfigurasi Tugas"
        subtitle="Domba Penguinakan • Manajemen jadwal kerja rutin pekerja kandang."
        isDesktop={isDesktop}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actionButton={isDesktop && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(true)}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500 font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 h-10 px-4 bg-transparent transition-all"
            >
              <Sparkles size={14} /> Paket Template
            </Button>
            <Button
              onClick={handleAddNew}
              className="bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 h-10 px-5 shadow-[0_4px_15px_rgba(34,197,94,0.3)]"
            >
              <Plus size={16} /> Template Baru
            </Button>
          </div>
        )}
      />

      <SummaryStrip items={stats} />

      <main className="p-5 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {!isDesktop ? (
            <motion.div key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              {filteredTemplates.length === 0 ? (
                <EmptyState 
                   icon={ClipboardList} 
                   title="Belum ada template" 
                   desc="Mulai dengan membuat template tugas rutin pertama Anda."
                   action={handleAddNew}
                />
              ) : (
                filteredTemplates.map(t => (
                  <TemplateItemMobile 
                    key={t.id} 
                    template={t} 
                    onEdit={handleEdit} 
                    isSelected={selectedIds.has(t.id)}
                    onToggleSelect={() => toggleSelection(t.id)}
                    onDelete={(id) => handleDeleteConfirm(id)} 
                  />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div key="desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="px-6 py-4 w-10">
                      <Checkbox 
                        checked={selectedIds.size === filteredTemplates.length && filteredTemplates.length > 0} 
                        onCheckedChange={toggleSelectAll} 
                      />
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Template Tugas</th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Kandang</th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Frekuensi</th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Assignee</th>
                    <th className="px-6 py-4 text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Integrasi</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-[#4B6478] uppercase tracking-widest">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filteredTemplates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-[#4B6478] font-bold uppercase tracking-widest text-xs">Data tidak ditemukan.</td>
                    </tr>
                  ) : (
                    filteredTemplates.map(t => {
                      const cfg = TASK_TYPE_CFG[t.task_type] || TASK_TYPE_CFG.lainnya
                      const isSelected = selectedIds.has(t.id)
                      const isOwner = profile?.role === 'owner'
                      const isProtected = t.title?.includes('Sampling') || 
                                          t.title?.includes('Intensif') || 
                                          t.title?.includes('Timbang Total (90 Hari)')
                      const isLocked = isProtected && !isOwner

                      return (
                        <tr key={t.id} className={cn(
                          "group hover:bg-white/[0.01] transition-colors",
                          isSelected && "bg-green-500/[0.03]",
                          isLocked && "opacity-50"
                        )}>
                          <td className="px-6 py-5">
                            <Checkbox 
                              checked={isSelected} 
                              onCheckedChange={() => !isLocked && toggleSelection(t.id)} 
                              disabled={isLocked}
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg border", cfg.bg, cfg.border)}>
                                <cfg.icon size={14} className={cfg.color} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-white">{t.title}</span>
                                {isLocked && <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5 flex items-center gap-1"><Lock size={8} /> Proyek Strategis (Hard-Locked)</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-bold text-[#4B6478] uppercase tracking-wider">{t.kandang_name || 'Semua'}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-[11px] font-black text-white uppercase tracking-tighter">{t.recurring_type}</span>
                               <span className="text-[10px] text-[#4B6478] font-black mt-0.5">{t.due_time?.substring(0, 5)} WIB</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                               <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-green-400 font-black shadow-inner">
                                 {t.assignee?.full_name?.charAt(0) || '?'}
                               </div>
                               <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{t.assignee?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             {t.linked_data_entry ? (
                               <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-400 uppercase tracking-widest shadow-inner">
                                 <Scale size={10} /> Data Entry
                               </div>
                             ) : (
                               <span className="text-[10px] text-[#4B6478] font-medium">—</span>
                             )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center gap-2">
                              {!isLocked ? (
                                <>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 rounded-lg transition-all" onClick={() => handleEdit(t)}><Settings2 size={14} /></Button>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" onClick={() => handleDeleteConfirm(t.id)}><Trash2 size={14} className="text-red-500/30" /></Button>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all" onClick={() => refresh.mutate(t.id)} disabled={refresh.isPending}><RefreshCcw size={14} className={cn(refresh.isPending && "animate-spin")} /></Button>
                                </>
                              ) : (
                                <div className="p-2 text-amber-500/40">
                                  <Lock size={16} />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-8 py-4 bg-[#0C1319]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[320px]"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center font-black text-xs text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                {selectedIds.size}
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-white/60">Terpilih</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
              >
                Batal
              </Button>
              <Button 
                onClick={() => handleDeleteConfirm()}
                className="bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl transition-all"
              >
                <Trash2 size={14} className="mr-2" /> Hapus Kolektif
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 text-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Sora'] font-bold text-xl">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {taskToDelete?.length > 1 
                ? `Apakah Anda yakin ingin menghapus ${taskToDelete.length} template tugas ini secara permanen?`
                : "Apakah Anda yakin ingin menghapus template tugas ini?"
              } Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-xl">
              {bulkDelete.isPending ? "Menghapus..." : "Ya, Hapus Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TemplateFormSheet open={sheetOpen} onOpenChange={setSheetOpen} template={selectedTemplate} isDesktop={isDesktop} />
      <DombaOSTemplateSheet open={templateModalOpen} onOpenChange={setTemplateModalOpen} existingTemplates={templates} isDesktop={isDesktop} />
    </div>
  )
}

function TemplateFormSheet({ open, onOpenChange, template, isDesktop }) {
  const isEdit = !!template
  const createTask = useCreateTaskTemplate()
  const updateTask = useUpdateTaskTemplate()
  const { data: batches = [] } = useDombaBatches()
  const { data: workers = [] } = useKandangWorkers()

  const [form, setForm] = useState({
    title: '', task_type: 'pakan', kandang_name: '', recurring_type: 'harian',
    recurring_interval: 1, recurring_days: [], start_date: new Date().toISOString().split('T')[0],
    end_date: '', due_time: '08:00:00', default_assignee_worker_id: '', linked_data_entry: false, is_active: true,
  })

  useEffect(() => {
    if (template && open) setForm({ ...template, recurring_days: template.recurring_days || [] })
    else if (open) setForm({
      title: '', task_type: 'pakan', kandang_name: '', recurring_type: 'harian',
      recurring_interval: 1, recurring_days: [], start_date: new Date().toISOString().split('T')[0],
      end_date: '', due_time: '08:00:00', default_assignee_worker_id: '', linked_data_entry: false, is_active: true,
    })
  }, [template, open])

  const kandangOptions = useMemo(() => [...new Set(batches.map(b => b.kandang_name).filter(Boolean))], [batches])

  function handleSubmit() {
    if (!form.title) return toast.error('Judul wajib diisi')
    if (isEdit) updateTask.mutate({ id: template.id, ...form }, { onSuccess: () => onOpenChange(false) })
    else createTask.mutate(form, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn("bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col", isDesktop ? "w-[520px]" : "rounded-t-[40px] max-h-[92vh]")}>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left">
            <SheetTitle className="font-['Sora'] font-black text-2xl text-white">{isEdit ? 'Edit Template' : 'Konfigurasi Template'}</SheetTitle>
            <SheetDescription className="text-xs text-[#4B6478] font-bold uppercase tracking-wider">Tentukan parameter jadwal dan integrasi tugas.</SheetDescription>
          </SheetHeader>
          
          <div className="space-y-6 text-white">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Judul Tugas *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Contoh: Pemberian Pakan Pagi" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all placeholder:text-white/10" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Jenis Tugas</label>
                <select value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all">
                  {Object.entries(TASK_TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Kandang</label>
                <select value={form.kandang_name} onChange={e => setForm(f => ({ ...f, kandang_name: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all">
                  <option value="">Semua Kandang</option>
                  {kandangOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Waktu (WIB)</label>
                  <input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Default Assignee</label>
                  <select value={form.default_assignee_worker_id} onChange={e => setForm(f => ({ ...f, default_assignee_worker_id: e.target.value }))} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none focus:border-green-500/50 transition-all">
                    <option value="">Auto-Assign (Off)</option>
                    {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
               </div>
            </div>

            <div className="p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                     <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <Scale size={16} className="text-green-400" />
                     </div>
                     <div>
                        <p className="text-sm font-bold">Terhubung Input Data</p>
                        <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">Form pakan/timbang otomatis muncul</p>
                     </div>
                  </div>
                  <Switch checked={form.linked_data_entry} onCheckedChange={v => setForm(f => ({ ...f, linked_data_entry: v }))} className="data-[state=checked]:bg-green-500" />
               </div>
            </div>
            
          </div>
        </div>
        <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
          <Button onClick={handleSubmit} disabled={createTask.isPending || updateTask.isPending} className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_20px_rgba(34,197,94,0.3)] transition-all">
             {createTask.isPending || updateTask.isPending ? 'Memproses...' : (isEdit ? 'Simpan Perubahan' : 'Publish Template')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DombaOSTemplateSheet({ open, onOpenChange, existingTemplates, isDesktop }) {
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const { data: activeBatches = [] } = useDombaActiveBatches()
  const applyTemplate = useApplyDombaTaskTemplate()

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId)
  const canApply = !!selectedPackage && !!selectedBatch

  function handleApply() {
    if (!canApply) return
    applyTemplate.mutate({ templateType: selectedPackage, batchStartDate: selectedBatch.start_date, kandangName: selectedBatch.kandang_name }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? 'right' : 'bottom'} className={cn('bg-[#0C1319]/95 backdrop-blur-xl border-white/10 p-0 flex flex-col', isDesktop ? 'w-[480px]' : 'rounded-t-[40px]')}>
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left">
             <SheetTitle className="font-['Sora'] font-black text-2xl text-white">Preset Domba OS</SheetTitle>
             <SheetDescription className="text-xs text-[#4B6478] font-bold uppercase tracking-wider">Terapkan paket manajemen tugas standar industri sekali klik.</SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4">
            <button 
               onClick={() => setSelectedPackage('90')} 
               className={cn('w-full text-left p-5 rounded-2xl border transition-all group relative overflow-hidden', 
               selectedPackage === '90' ? 'bg-green-500/10 border-green-500 shadow-inner' : 'bg-white/[0.02] border-white/5 hover:border-white/20')}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                   <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", selectedPackage === '90' ? "bg-green-500/20 border-green-500/30" : "bg-white/5 border-white/10")}>
                      <PlusCircle size={14} className={selectedPackage === '90' ? "text-green-400" : "text-[#4B6478]"} />
                   </div>
                   <p className="font-['Sora'] font-black text-sm text-white">Penggemukan Intensif (90 Hari)</p>
                </div>
                <p className="text-[11px] text-[#4B6478] font-bold leading-relaxed">
                   Setiap batch akan mendapatkan jadwal otomatis pemberian pakan (2x/hari), penimbangan rutin (mingguan), dan pemantauan kesehatan berkala.
                </p>
              </div>
              {selectedPackage === '90' && <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/20 rounded-bl-3xl flex items-center justify-center"><Check size={20} className="text-green-400" /></div>}
            </button>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pilih Batch Tujuan</label>
            <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="w-full h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none focus:border-green-500/50">
              <option value="">-- Pilih target batch --</option>
              {activeBatches.map(b => <option key={b.id} value={b.id}>{b.batch_code} • {b.kandang_name}</option>)}
            </select>
          </div>
        </div>
        <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
          <Button onClick={handleApply} disabled={!canApply || applyTemplate.isPending} className="w-full h-14 bg-green-500 hover:bg-green-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-[0_8px_20px_rgba(34,197,94,0.3)] transition-all">
             {applyTemplate.isPending ? 'Menerapkan...' : 'Terapkan Sekarang'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
