import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useOutletContext } from 'react-router-dom'
import {
  Plus, Calendar, Users, Settings2, Trash2,
  ChevronRight, Utensils, Scale, Syringe,
  Activity, ClipboardList, Clock, Info,
  Check, X, Search, MoreVertical, RefreshCcw,
  Sparkles, AlertTriangle
} from 'lucide-react'
import {
  usePeternakTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  useKandangWorkers,
  useGenerateInstancesFromTemplate,
  useApplySapiTaskTemplate,
} from '@/lib/hooks/usePeternakTaskData'
import { useSapiBatches, useSapiActiveBatches } from '@/lib/hooks/useSapiPenggemukanData'
import { TEMPLATE_150_HARI, TEMPLATE_180_HARI } from '@/lib/constants/sapiTaskTemplates'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Switch } from '@/components/ui/switch'
import { InputNumber } from '@/components/ui/InputNumber'
import LoadingSpinner from '../../_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '../../_shared/components/transactions/BrokerPageHeader'
import { BrokerBaseCard } from '../../_shared/components/transactions/BrokerBaseCard'
import EmptyState from '../../_shared/components/EmptyState'
import { toast } from 'sonner'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

const TASK_TYPE_CFG = {
  pemberian_pakan: { label: 'Pakan', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  timbang: { label: 'Timbang', icon: Scale, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/20' },
  vaksinasi: { label: 'Vaksin', icon: Syringe, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
  kebersihan: { label: 'Kebersihan', icon: Trash2, color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/20' },
  ceklis_kesehatan: { label: 'Kesehatan', icon: Activity, color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' },
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

// â”€â”€ LOCAL COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SummaryStrip({ items = [] }) {
  return (
    <div className="bg-[#7C3AED]/[0.04] border-b border-white/5 px-5 py-3.5 flex justify-between items-center overflow-x-auto no-scrollbar">
      {items.map((item, idx) => (
        <div key={item.label} className={cn("min-w-[120px] px-6 border-r border-white/5 last:border-0")}>
          <p className="font-black text-[#4B6478] uppercase tracking-widest leading-none mb-1.5 text-[9px]">
            {item.label}
          </p>
          <p className="font-black text-sm text-white tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function TemplateItemMobile({ template, onEdit, onDelete }) {
  const cfg = TASK_TYPE_CFG[template.task_type] || TASK_TYPE_CFG.lainnya
  const refresh = useGenerateInstancesFromTemplate()

  return (
    <BrokerBaseCard 
      onClick={() => onEdit(template)}
      isDesktop={false}
      className="mb-3"
      header={
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl border", cfg.bg, cfg.border)}>
            <cfg.icon size={18} className={cfg.color} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{template.title}</h3>
            <p className="text-[10px] font-bold text-[#4B6478] uppercase tracking-wider mt-0.5">
              {template.recurring_type} • {template.kandang_name || 'Semua Kandang'}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={12} className="text-[#4B6478]" />
            <span className="text-[10px] font-medium text-slate-400">
              {template.assignee?.full_name || 'Unassigned'}
            </span>
          </div>
          <div className="flex gap-1">
             <Button 
                variant="ghost" size="icon" className="h-8 w-8 text-red-500/50 hover:text-red-400"
                onClick={(e) => { e.stopPropagation(); onDelete(template.id); }}
             >
                <Trash2 size={14} />
             </Button>
             <Button 
                variant="ghost" size="icon" className="h-8 w-8 text-[#7C3AED]"
                onClick={(e) => { e.stopPropagation(); refresh.mutate(template.id); }}
                disabled={refresh.isPending}
             >
                <RefreshCcw size={14} className={refresh.isPending ? "animate-spin" : ""} />
             </Button>
          </div>
        </div>
      }
    />
  )
}

// â”€â”€ MAIN COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SapiTaskSettings() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  
  // Data
  const { data: templates = [], isLoading } = usePeternakTaskTemplates()
  const deleteTask = useDeleteTaskTemplate()
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

  const { setRightAction } = useOutletContext()
  useEffect(() => {
    if (!isDesktop) {
      setRightAction(
        <button
          onClick={handleAddNew}
          className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
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
        title="Pengaturan Tugas"
        subtitle="Kelola jadwal dan template tugas rutin untuk pekerja kandang."
        isDesktop={isDesktop}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actionButton={isDesktop && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(true)}
              className="border-[#7C3AED]/40 text-[#A78BFA] hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] font-bold rounded-xl gap-2 h-10 px-4 bg-transparent transition-all"
            >
              <Sparkles size={16} /> Template TernakOS
            </Button>
            <Button
              onClick={handleAddNew}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl gap-2 h-10 px-4"
            >
              <Plus size={18} /> Buat Template
            </Button>
          </div>
        )}
      />

      <SummaryStrip items={stats} />

      <main className="p-5 max-w-[1600px] mx-auto">
        <AnimatePresence mode="wait">
          {!isDesktop ? (
            // MOBILE VIEW
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
                    onDelete={(id) => {
                      if(window.confirm('Hapus template? Jadwal yang sudah ada tidak akan hilang.')) {
                        deleteTask.mutate(id)
                      }
                    }} 
                  />
                ))
              )}
            </motion.div>
          ) : (
            // DESKTOP VIEW: TABLE
            <motion.div key="desktop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#111C24] border border-white/5 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
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
                      <td colSpan={6} className="py-20 text-center text-slate-500 font-medium">Data tidak ditemukan.</td>
                    </tr>
                  ) : (
                    filteredTemplates.map(t => {
                      const cfg = TASK_TYPE_CFG[t.task_type] || TASK_TYPE_CFG.lainnya
                      return (
                        <tr key={t.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg border", cfg.bg, cfg.border)}>
                                <cfg.icon size={14} className={cfg.color} />
                              </div>
                              <span className="font-bold text-sm text-white">{t.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-medium text-slate-400">{t.kandang_name || 'Semua'}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-slate-200 uppercase tracking-tighter">{t.recurring_type}</span>
                               <span className="text-[10px] text-[#4B6478] font-bold mt-0.5">{t.due_time.substring(0, 5)} WIB</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-slate-500 font-black">
                                 {t.assignee?.full_name?.charAt(0) || '?'}
                               </div>
                               <span className="text-xs font-medium text-slate-300">{t.assignee?.full_name || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                             {t.linked_data_entry ? (
                               <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                 <Scale size={10} /> Data Entry
                               </div>
                             ) : (
                               <span className="text-[10px] text-[#4B6478] font-medium">—</span>
                             )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-white/5 bg-white/5 hover:bg-white/10"
                                onClick={() => handleEdit(t)}
                              >
                                <Settings2 size={14} className="text-slate-400" />
                              </Button>
                              <Button 
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-white/5 bg-white/5 hover:bg-red-500/10 group-hover:border-red-500/20"
                                onClick={() => {
                                  if(window.confirm('Hapus template?')) deleteTask.mutate(t.id)
                                }}
                              >
                                <Trash2 size={14} className="text-red-500/50 group-hover:text-red-400" />
                              </Button>
                              <Button 
                                variant="outline" size="sm" className="h-8 w-8 p-0 border-white/5 bg-white/5 hover:bg-[#7C3AED]/10"
                                onClick={() => refresh.mutate(t.id)}
                                disabled={refresh.isPending}
                              >
                                <RefreshCcw size={14} className={cn("text-[#7C3AED]", refresh.isPending && "animate-spin")} />
                              </Button>
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

      <TemplateFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={selectedTemplate}
        isDesktop={isDesktop}
      />
      <TernakOSTemplateSheet
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        existingTemplates={templates}
        isDesktop={isDesktop}
      />
    </div>
  )
}

// â”€â”€â”€ FORM COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TemplateFormSheet({ open, onOpenChange, template, isDesktop }) {
  const isEdit = !!template
  const createTask = useCreateTaskTemplate()
  const updateTask = useUpdateTaskTemplate()
  const { data: batches = [] } = useSapiBatches()
  const { data: workers = [] } = useKandangWorkers()

  const [form, setForm] = useState({
    title: '',
    task_type: 'pemberian_pakan',
    kandang_name: '',
    recurring_type: 'harian',
    recurring_interval: 1,
    recurring_days: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    due_time: '08:00:00',
    default_assignee_worker_id: '',
    linked_data_entry: false,
    is_active: true,
  })

  useEffect(() => {
    if (template && open) {
      setForm({ ...template, recurring_days: template.recurring_days || [] })
    } else if (open) {
      setForm({
        title: '', task_type: 'pemberian_pakan', kandang_name: '', recurring_type: 'harian',
        recurring_interval: 1, recurring_days: [],
        start_date: new Date().toISOString().split('T')[0], end_date: '',
        due_time: '08:00:00', default_assignee_worker_id: '',
        linked_data_entry: false, is_active: true,
      })
    }
  }, [template, open])

  const kandangOptions = useMemo(() => {
    const names = batches.map(b => b.kandang_name).filter(Boolean)
    return [...new Set(names)]
  }, [batches])

  function toggleDay(day) {
    setForm(f => ({
      ...f,
      recurring_days: f.recurring_days.includes(day)
        ? f.recurring_days.filter(d => d !== day)
        : [...f.recurring_days, day]
    }))
  }

  function handleSubmit() {
    if (!form.title) return toast.error('Judul wajib diisi')
    if (isEdit) {
      updateTask.mutate({ id: template.id, ...form }, { onSuccess: () => onOpenChange(false) })
    } else {
      createTask.mutate(form, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={isDesktop ? 'right' : 'bottom'} 
        className={cn(
          "bg-[#0C1319] border-white/10 outline-none p-0 flex flex-col",
          isDesktop ? "w-[520px] border-l" : "rounded-t-[32px] border-t max-h-[92vh]"
        )}
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left">
            {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
            <SheetTitle className="font-display font-black text-2xl text-white">
              {isEdit ? 'Edit Template' : 'Buat Template'}
            </SheetTitle>
            <p className="text-sm text-[#4B6478]">Konfigurasi jadwal tugas rutin pekerja.</p>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Judul Tugas *</label>
              <input 
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Misal: Beri Pakan Konsentrat"
                className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Jenis Tugas</label>
                <select 
                  value={form.task_type}
                  onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}
                  className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none appearance-none"
                >
                  {Object.entries(TASK_TYPE_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Kandang</label>
                <select 
                  value={form.kandang_name}
                  onChange={e => setForm(f => ({ ...f, kandang_name: e.target.value }))}
                  className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none appearance-none"
                >
                  <option value="">Semua Kandang</option>
                  {kandangOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(form.task_type === 'timbang' || form.task_type === 'vaksinasi' || form.task_type === 'ceklis_kesehatan') && (
              <div className="flex items-center justify-between p-5 border border-white/5 bg-[#111C24] rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-white">Hubungkan Input Data</p>
                  <p className="text-[10px] text-[#4B6478] mt-1 font-medium italic">Minta input detail saat tugas selesai.</p>
                </div>
                <Switch 
                  checked={form.linked_data_entry}
                  onCheckedChange={v => setForm(f => ({ ...f, linked_data_entry: v }))}
                />
              </div>
            )}

            <div className="border-t border-white/5 pt-6 space-y-5">
              <h4 className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penjadwalan (Recurrence)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Frekuensi</label>
                  <select 
                    value={form.recurring_type}
                    onChange={e => setForm(f => ({ ...f, recurring_type: e.target.value }))}
                    className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none appearance-none"
                  >
                    {RECURRING_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Waktu Mulai</label>
                  <input 
                    type="time"
                    value={form.due_time}
                    onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                    className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none"
                  />
                </div>
              </div>

              {form.recurring_type === 'mingguan' && (
                <div className="flex justify-between gap-1">
                  {DAYS.map(d => {
                    const active = form.recurring_days.includes(d.value)
                    return (
                      <button 
                        key={d.value}
                        onClick={() => toggleDay(d.value)}
                        className={cn(
                          "flex-1 h-11 rounded-xl border text-[10px] font-black transition-all",
                          active ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "bg-white/5 border-white/10 text-[#4B6478]"
                        )}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Mulai Tanggal</label>
                  <DatePicker value={form.start_date} onChange={d => setForm(f => ({ ...f, start_date: d }))} className="h-12" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Berakhir (Opsional)</label>
                  <DatePicker value={form.end_date} onChange={d => setForm(f => ({ ...f, end_date: d }))} className="h-12" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6">
              <label className="text-[10px] font-black text-[#4B6478] uppercase mb-2 block">Petugas Penanggung Jawab</label>
              <select 
                value={form.default_assignee_worker_id}
                onChange={e => setForm(f => ({ ...f, default_assignee_worker_id: e.target.value }))}
                className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none appearance-none font-medium"
              >
                <option value="">-- Pilih Pekerja --</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-[#06090F]">
          <Button 
            onClick={handleSubmit}
            disabled={createTask.isPending || updateTask.isPending}
            className="w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black uppercase text-[11px] tracking-widest rounded-2xl"
          >
            {createTask.isPending || updateTask.isPending ? 'Menyimpan...' : (isEdit ? 'Update Template' : 'Simpan Template')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// â”€â”€â”€ TERNAKOS TEMPLATE SHEET â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PACKAGE_INFO = {
  '150': {
    label: 'Paket 150 Hari — Intensif',
    desc: 'Cocok untuk kandang tertutup dengan pakan konsentrat penuh.',
    adg: '~1 kg/hari',
    count: TEMPLATE_150_HARI.length,
  },
  '180': {
    label: 'Paket 180 Hari — Semi-Intensif',
    desc: 'Cocok untuk sistem campuran hijauan + konsentrat.',
    adg: '~0.8 kg/hari',
    count: TEMPLATE_180_HARI.length,
  },
}

function TernakOSTemplateSheet({ open, onOpenChange, existingTemplates, isDesktop }) {
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const { data: activeBatches = [] } = useSapiActiveBatches()
  const applyTemplate = useApplySapiTaskTemplate()

  const selectedBatch = activeBatches.find(b => b.id === selectedBatchId)
  const existingCount = selectedBatch
    ? existingTemplates.filter(t => t.kandang_name === selectedBatch.kandang_name).length
    : 0

  const canApply = !!selectedPackage && !!selectedBatch

  function handleApply() {
    if (!canApply) return
    applyTemplate.mutate(
      {
        templateType: selectedPackage,
        batchStartDate: selectedBatch.start_date,
        kandangName: selectedBatch.kandang_name,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  useEffect(() => {
    if (!open) {
      setSelectedPackage(null)
      setSelectedBatchId('')
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? 'right' : 'bottom'}
        className={cn(
          'bg-[#0C1319] border-white/10 outline-none p-0 flex flex-col',
          isDesktop ? 'w-[480px] border-l' : 'rounded-t-[32px] border-t max-h-[92vh]'
        )}
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <SheetHeader className="text-left space-y-2">
            {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                <Sparkles size={18} className="text-[#A78BFA]" />
              </div>
              <div>
                <SheetTitle className="font-display font-black text-xl text-white">Template TernakOS</SheetTitle>
                <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">Berdasarkan SNI feedlot sapi potong Indonesia</p>
              </div>
            </div>
          </SheetHeader>

          {/* Package Cards */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pilih Paket</p>
            {Object.entries(PACKAGE_INFO).map(([key, pkg]) => {
              const active = selectedPackage === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPackage(key)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                    active
                      ? 'bg-[#7C3AED]/10 border-[#7C3AED]/50 shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className={cn('font-black text-sm', active ? 'text-white' : 'text-slate-300')}>
                        {pkg.label}
                      </p>
                      <p className="text-[11px] text-[#4B6478] mt-1 font-medium">{pkg.desc}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-[#A78BFA] bg-[#7C3AED]/10 border border-[#7C3AED]/20 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                          ADG {pkg.adg}
                        </span>
                        <span className="text-[10px] text-[#4B6478] font-bold">
                          {pkg.count} template tugas
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                      active ? 'border-[#7C3AED] bg-[#7C3AED]' : 'border-white/20'
                    )}>
                      {active && <Check size={12} className="text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Batch / Kandang Select */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Kandang Tujuan</p>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className="w-full h-12 bg-[#111C24] border border-white/5 rounded-xl px-4 text-sm text-white focus:border-[#7C3AED] outline-none appearance-none font-medium"
            >
              <option value="">-- Pilih batch aktif --</option>
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} — {b.kandang_name}
                </option>
              ))}
            </select>
            {activeBatches.length === 0 && (
              <p className="text-[11px] text-[#4B6478] font-medium italic pl-1">
                Belum ada batch aktif. Buat batch terlebih dahulu di halaman Batch.
              </p>
            )}
          </div>

          {/* Warning: existing templates */}
          {existingCount > 0 && selectedBatch && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
              <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/80 font-medium leading-relaxed">
                Kandang <span className="font-black text-amber-300">{selectedBatch.kandang_name}</span> sudah
                memiliki <span className="font-black">{existingCount} template aktif</span>. Menerapkan paket
                ini akan <span className="font-black">menambah</span>, bukan mengganti template yang ada.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-[#06090F]">
          <Button
            onClick={handleApply}
            disabled={!canApply || applyTemplate.isPending}
            className="w-full h-12 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all"
          >
            {applyTemplate.isPending ? 'Menerapkan...' : 'Terapkan Template'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}