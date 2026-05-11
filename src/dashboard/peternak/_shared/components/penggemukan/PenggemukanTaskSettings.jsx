import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import {
  Plus, Users, Settings2, Trash2,
  Scale, Syringe,
  Activity, ClipboardList, Utensils,
  Check, RefreshCcw,
  Sparkles, AlertTriangle, Lock
} from 'lucide-react'
import {
  usePeternakTaskTemplates,
  useCreateTaskTemplate,
  useUpdateTaskTemplate,
  useDeleteTaskTemplate,
  useBulkDeleteTaskTemplates,
  useKandangWorkers,
  useGenerateInstancesFromTemplate,
} from '@/lib/hooks/usePeternakTaskData'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Switch } from '@/components/ui/switch'
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
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
import { BrokerBaseCard } from '@/dashboard/_shared/components/transactions/BrokerBaseCard'
import EmptyState from '@/dashboard/_shared/components/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { isSuperadmin } from '@/lib/auth'

// ─── Accent Map ──────────────────────────────────────────────────────────────

const ACCENT = {
  purple: {
    bg: 'bg-[#7C3AED]',
    bgHover: 'hover:bg-[#6D28D9]',
    bgMuted: 'bg-[#7C3AED]/15',
    bgSubtle: 'bg-[#7C3AED]/10',
    border: 'border-[#7C3AED]/30',
    borderMuted: 'border-[#7C3AED]/20',
    text: 'text-[#A78BFA]',
    shadow: 'shadow-[0_4px_12px_rgba(124,58,237,0.3)]',
    shadowLg: 'shadow-[0_8px_20px_rgba(124,58,237,0.3)]',
    stripBg: 'bg-[#7C3AED]/[0.04]',
    checkGlow: 'shadow-[0_0_10px_rgba(124,58,237,0.3)]',
    outlineBorder: 'border-[#7C3AED]/40',
    outlineText: 'text-[#A78BFA]',
    outlineHover: 'hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]',
    focusBorder: 'focus:border-[#7C3AED]',
    inputFocus: 'focus:border-[#7C3AED]/50',
    switchColor: 'data-[state=checked]:bg-[#7C3AED]',
    dataEntryBg: 'bg-[#7C3AED]/10 border-[#7C3AED]/20',
    dataEntryIcon: 'text-[#A78BFA]',
    selectedRow: 'bg-[#7C3AED]/[0.03]',
    selectedCheckBg: 'bg-[#7C3AED] border-[#7C3AED]',
    refreshHover: 'hover:text-[#A78BFA] hover:bg-[#7C3AED]/10',
    bulkCountBg: 'bg-[#7C3AED]',
  },
  green: {
    bg: 'bg-green-500',
    bgHover: 'hover:bg-green-600',
    bgMuted: 'bg-green-500/15',
    bgSubtle: 'bg-green-500/10',
    border: 'border-green-500/30',
    borderMuted: 'border-green-500/20',
    text: 'text-green-400',
    shadow: 'shadow-[0_4px_12px_rgba(34,197,94,0.3)]',
    shadowLg: 'shadow-[0_8px_20px_rgba(34,197,94,0.3)]',
    stripBg: 'bg-green-500/[0.04]',
    checkGlow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    outlineBorder: 'border-green-500/30',
    outlineText: 'text-green-400',
    outlineHover: 'hover:bg-green-500/10 hover:border-green-500',
    focusBorder: 'focus:border-green-500',
    inputFocus: 'focus:border-green-500/50',
    switchColor: 'data-[state=checked]:bg-green-500',
    dataEntryBg: 'bg-green-500/10 border-green-500/20',
    dataEntryIcon: 'text-green-400',
    selectedRow: 'bg-green-500/[0.03]',
    selectedCheckBg: 'bg-green-500 border-green-500',
    refreshHover: 'hover:text-green-400 hover:bg-green-500/10',
    bulkCountBg: 'bg-green-500',
  },
}

// ─── Shared Constants ─────────────────────────────────────────────────────────

const TASK_TYPE_CFG = {
  pemberian_pakan:    { label: 'Pakan',      icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  pakan:              { label: 'Pakan',      icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' },
  timbang:            { label: 'Timbang',    icon: Scale,         color: 'text-blue-400',   bg: 'bg-blue-500/15',   border: 'border-blue-500/20' },
  vaksinasi:          { label: 'Vaksin',     icon: Syringe,       color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/20' },
  kebersihan:         { label: 'Kebersihan', icon: Trash2,        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/20' },
  kebersihan_kandang: { label: 'Kebersihan', icon: Trash2,        color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/20' },
  ceklis_kesehatan:   { label: 'Kesehatan',  icon: Activity,      color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/20' },
  kesehatan:          { label: 'Kesehatan',  icon: Activity,      color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/20' },
  wool_check:         { label: 'Cek Wool',   icon: ClipboardList, color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/20' },
  bcs_check:          { label: 'BCS',        icon: ClipboardList, color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/20' },
  lainnya:            { label: 'Lainnya',    icon: ClipboardList, color: 'text-slate-400',  bg: 'bg-white/10',      border: 'border-white/10' },
}

const RECURRING_TYPES = [
  { value: 'harian',       label: 'Harian' },
  { value: 'mingguan',     label: 'Mingguan' },
  { value: 'dua_mingguan', label: '2 Mingguan' },
  { value: 'bulanan',      label: 'Bulanan' },
  { value: 'custom',       label: 'Kustom (Hari)' },
  { value: 'sekali',       label: 'Sekali Saja' },
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

// ─── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onCheckedChange, className, disabled = false, accent }) {
  return (
    <div
      onClick={(e) => { if (disabled) return; e.stopPropagation(); onCheckedChange(!checked) }}
      className={cn(
        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        checked
          ? cn(accent.selectedCheckBg, accent.checkGlow)
          : "bg-white/5 border-white/20 hover:border-white/40",
        className
      )}
    >
      {checked && <Check size={14} className="text-white" strokeWidth={4} />}
    </div>
  )
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ items = [], accent }) {
  return (
    <div className={cn("border-b border-white/[0.04] px-5 py-4 flex flex-wrap gap-4 items-center overflow-x-auto no-scrollbar", accent.stripBg)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-[140px] px-6 border-r border-white/5 last:border-0">
          <p className="font-black text-[#4B6478] uppercase tracking-widest leading-none mb-2 text-[9px]">
            {item.label}
          </p>
          <p className="font-bold text-lg text-white tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── TemplateItemMobile ───────────────────────────────────────────────────────

function TemplateItemMobile({ template, onEdit, onDelete, isSelected, onToggleSelect, accent }) {
  const cfg = TASK_TYPE_CFG[template.task_type] || TASK_TYPE_CFG.lainnya
  const refresh = useGenerateInstancesFromTemplate()
  const { profile } = useAuth()
  const isOwner = isSuperadmin(profile) || profile?.role === 'owner'
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
        isSelected && cn(accent.bgSubtle, accent.border, "scale-[0.98] shadow-inner"),
        isLocked && "opacity-60 grayscale-[0.3]"
      )}
      header={
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            className="mr-1"
            disabled={isLocked}
            accent={accent}
          />
          <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shadow-inner", cfg.bg, cfg.border)}>
            <cfg.icon size={18} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white truncate">{template.title}</h3>
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
            {!isLocked ? (
              <>
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 text-red-500/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  onClick={(e) => { e.stopPropagation(); onDelete(template.id) }}
                >
                  <Trash2 size={14} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={cn("h-8 w-8 rounded-lg transition-all", accent.refreshHover)}
                  onClick={(e) => { e.stopPropagation(); refresh.mutate(template.id) }}
                  disabled={refresh.isPending}
                >
                  <RefreshCcw size={14} className={refresh.isPending ? "animate-spin" : ""} />
                </Button>
              </>
            ) : (
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

// ─── TemplateFormSheet ────────────────────────────────────────────────────────

function TemplateFormSheet({ open, onOpenChange, template, isDesktop, hooks, config, accent }) {
  const isEdit = !!template
  const createTask = useCreateTaskTemplate()
  const updateTask = useUpdateTaskTemplate()
  const { data: batches = [] } = hooks.useBatches()
  const { data: workers = [] } = useKandangWorkers()

  const defaultForm = {
    title: '',
    task_type: config.defaultTaskType,
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
  }

  const [form, setForm] = useState(defaultForm)

  useEffect(() => {
    if (template && open) {
      setForm({ ...template, recurring_days: template.recurring_days || [] })
    } else if (open) {
      setForm(defaultForm)
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
        : [...f.recurring_days, day],
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
          "bg-[#0C1319]/95 backdrop-blur-xl border-white/10 outline-none p-0 flex flex-col",
          isDesktop ? "w-[520px] border-l" : "rounded-t-[40px] border-t max-h-[92vh]"
        )}
      >
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left">
            {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
            <SheetTitle className="font-bold text-2xl text-white">
              {isEdit ? 'Edit Template' : 'Konfigurasi Template'}
            </SheetTitle>
            <SheetDescription className="text-xs text-[#4B6478] font-bold uppercase tracking-wider">
              Tentukan parameter jadwal dan integrasi tugas.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 text-white">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Judul Tugas *</label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Contoh: Pemberian Pakan Pagi"
                className={cn(
                  "w-full min-h-[44px] h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-base font-bold focus:outline-none transition-all placeholder:text-white/10",
                  accent.inputFocus
                )}
              />
            </div>

            {/* Task type + Kandang */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Jenis Tugas</label>
                <select
                  value={form.task_type}
                  onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}
                  className={cn(
                    "w-full min-h-[44px] h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none transition-all appearance-none",
                    accent.inputFocus
                  )}
                >
                  {Object.entries(TASK_TYPE_CFG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Kandang</label>
                <select
                  value={form.kandang_name}
                  onChange={e => setForm(f => ({ ...f, kandang_name: e.target.value }))}
                  className={cn(
                    "w-full min-h-[44px] h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none transition-all appearance-none",
                    accent.inputFocus
                  )}
                >
                  <option value="">Semua Kandang</option>
                  {kandangOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time + Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Waktu (WIB)</label>
                <input
                  type="time"
                  value={form.due_time}
                  onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))}
                  className={cn(
                    "w-full min-h-[44px] h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-base font-bold focus:outline-none transition-all",
                    accent.inputFocus
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Default Assignee</label>
                <select
                  value={form.default_assignee_worker_id}
                  onChange={e => setForm(f => ({ ...f, default_assignee_worker_id: e.target.value }))}
                  className={cn(
                    "w-full min-h-[44px] h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none transition-all appearance-none",
                    accent.inputFocus
                  )}
                >
                  <option value="">Auto-Assign (Off)</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurrence section */}
            <div className="border-t border-white/5 pt-6 space-y-5">
              <h4 className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Penjadwalan (Recurrence)</h4>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Frekuensi</label>
                <select
                  value={form.recurring_type}
                  onChange={e => setForm(f => ({ ...f, recurring_type: e.target.value }))}
                  className={cn(
                    "w-full min-h-[44px] h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold focus:outline-none transition-all appearance-none",
                    accent.inputFocus
                  )}
                >
                  {RECURRING_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
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
                          active
                            ? cn(accent.bg, accent.border, 'text-white')
                            : "bg-white/5 border-white/10 text-[#4B6478]"
                        )}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Mulai Tanggal</label>
                  <DatePicker
                    value={form.start_date}
                    onChange={d => setForm(f => ({ ...f, start_date: d }))}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Berakhir (Opsional)</label>
                  <DatePicker
                    value={form.end_date}
                    onChange={d => setForm(f => ({ ...f, end_date: d }))}
                    className="h-12"
                  />
                </div>
              </div>
            </div>

            {/* Linked data entry */}
            <div className={cn("p-5 border rounded-2xl space-y-0", accent.dataEntryBg)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center", accent.dataEntryBg)}>
                    <Scale size={16} className={accent.dataEntryIcon} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Terhubung Input Data</p>
                    <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-wider">Form pakan/timbang otomatis muncul</p>
                  </div>
                </div>
                <Switch
                  checked={form.linked_data_entry}
                  onCheckedChange={v => setForm(f => ({ ...f, linked_data_entry: v }))}
                  className={accent.switchColor}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
          <Button
            onClick={handleSubmit}
            disabled={createTask.isPending || updateTask.isPending}
            className={cn(
              "w-full h-14 text-white font-black uppercase tracking-widest rounded-2xl transition-all",
              accent.bg, accent.bgHover, accent.shadowLg
            )}
          >
            {createTask.isPending || updateTask.isPending ? 'Memproses...' : (isEdit ? 'Simpan Perubahan' : 'Publish Template')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── PresetTemplateSheet ──────────────────────────────────────────────────────

function PresetTemplateSheet({ open, onOpenChange, existingTemplates, isDesktop, hooks, accent, templatePackages }) {
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const { data: activeBatches = [] } = hooks.useActiveBatches()
  const applyTemplate = hooks.useApplyTemplate()

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
          'bg-[#0C1319]/95 backdrop-blur-xl border-white/10 outline-none p-0 flex flex-col',
          isDesktop ? 'w-[480px] border-l' : 'rounded-t-[40px] border-t max-h-[92vh]'
        )}
      >
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <SheetHeader className="text-left space-y-2">
            {!isDesktop && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4" />}
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-2xl border flex items-center justify-center", accent.bgSubtle, accent.border)}>
                <Sparkles size={18} className={accent.text} />
              </div>
              <div>
                <SheetTitle className="font-bold text-xl text-white">Template TernakOS</SheetTitle>
                <p className="text-[11px] text-[#4B6478] font-medium mt-0.5">Terapkan paket manajemen tugas standar industri sekali klik.</p>
              </div>
            </div>
          </SheetHeader>

          {/* Package Cards */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Pilih Paket</p>
            {templatePackages.map((pkg) => {
              const active = selectedPackage === pkg.key
              return (
                <button
                  key={pkg.key}
                  onClick={() => setSelectedPackage(pkg.key)}
                  className={cn(
                    'w-full text-left p-5 rounded-2xl border transition-all duration-200',
                    active
                      ? cn(accent.bgSubtle, accent.border, 'shadow-inner')
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className={cn('font-black text-sm', active ? 'text-white' : 'text-slate-300')}>
                        {pkg.label}
                      </p>
                      <p className="text-[11px] text-[#4B6478] mt-1 font-medium leading-relaxed">{pkg.desc}</p>
                      {pkg.stats && (
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border", accent.bgSubtle, accent.text, accent.borderMuted)}>
                            {pkg.stats}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                      active ? cn(accent.bg, accent.border) : 'border-white/20'
                    )}>
                      {active && <Check size={12} className="text-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Batch select */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[#4B6478] uppercase tracking-widest">Kandang Tujuan</label>
            <select
              value={selectedBatchId}
              onChange={e => setSelectedBatchId(e.target.value)}
              className={cn(
                "w-full min-h-[44px] h-14 bg-[#111C24] border border-white/10 rounded-2xl px-5 text-sm font-bold text-white focus:outline-none transition-all appearance-none",
                accent.inputFocus
              )}
            >
              <option value="">-- Pilih batch aktif --</option>
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>{b.batch_code} • {b.kandang_name}</option>
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

        <div className="p-8 border-t border-white/[0.04] bg-[#06090F]">
          <Button
            onClick={handleApply}
            disabled={!canApply || applyTemplate.isPending}
            className={cn(
              "w-full h-14 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              accent.bg, accent.bgHover, accent.shadowLg
            )}
          >
            {applyTemplate.isPending ? 'Menerapkan...' : 'Terapkan Template'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PenggemukanTaskSettings({ config, hooks }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const accent = ACCENT[config.accentTheme] ?? ACCENT.green

  const { profile } = useAuth()

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [templateModalOpen, setTemplateModalOpen] = useState(false)

  const showPresetButton = !!(config.templatePackages && hooks.useApplyTemplate)

  const { data: templates = [], isLoading } = usePeternakTaskTemplates({ livestockType: config.livestockType })
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
      },
    })
  }

  const { setRightAction } = useOutletContext()
  useEffect(() => {
    if (!isDesktop) {
      setRightAction(
        <button
          onClick={handleAddNew}
          className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", accent.bg, accent.shadow)}
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
        title={config.pageTitle}
        subtitle={config.pageSubtitle}
        isDesktop={isDesktop}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actionButton={isDesktop && (
          <div className="flex items-center gap-2">
            {showPresetButton && (
              <Button
                variant="outline"
                onClick={() => setTemplateModalOpen(true)}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 h-10 px-4 bg-transparent transition-all border",
                  accent.outlineBorder, accent.outlineText, accent.outlineHover
                )}
              >
                <Sparkles size={14} /> Template TernakOS
              </Button>
            )}
            <Button
              onClick={handleAddNew}
              className={cn(
                "text-white font-black uppercase tracking-widest text-[10px] rounded-xl gap-2 h-10 px-5",
                accent.bg, accent.bgHover, accent.shadow
              )}
            >
              <Plus size={16} /> Template Baru
            </Button>
          </div>
        )}
      />

      <SummaryStrip items={stats} accent={accent} />

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
                    accent={accent}
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
                        accent={accent}
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
                      <td colSpan={7} className="py-20 text-center text-[#4B6478] font-bold uppercase tracking-widest text-xs">
                        Data tidak ditemukan.
                      </td>
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
                        <tr
                          key={t.id}
                          className={cn(
                            "group hover:bg-white/[0.01] transition-colors",
                            isSelected && accent.selectedRow,
                            isLocked && "opacity-50"
                          )}
                        >
                          <td className="px-6 py-5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => !isLocked && toggleSelection(t.id)}
                              disabled={isLocked}
                              accent={accent}
                            />
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg border", cfg.bg, cfg.border)}>
                                <cfg.icon size={14} className={cfg.color} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-white">{t.title}</span>
                                {isLocked && (
                                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                    <Lock size={8} /> Proyek Strategis (Hard-Locked)
                                  </span>
                                )}
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
                              <div className={cn("w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black shadow-inner", accent.text)}>
                                {t.assignee?.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                {t.assignee?.full_name?.split(' ')[0] || 'Unassigned'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {t.linked_data_entry ? (
                              <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest shadow-inner", accent.bgSubtle, accent.text, accent.borderMuted)}>
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
                                  <Button
                                    variant="outline" size="sm"
                                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:bg-white/10 rounded-lg transition-all"
                                    onClick={() => handleEdit(t)}
                                  >
                                    <Settings2 size={14} />
                                  </Button>
                                  <Button
                                    variant="outline" size="sm"
                                    className="h-8 w-8 p-0 bg-white/5 border-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    onClick={() => handleDeleteConfirm(t.id)}
                                  >
                                    <Trash2 size={14} className="text-red-500/30" />
                                  </Button>
                                  <Button
                                    variant="outline" size="sm"
                                    className={cn("h-8 w-8 p-0 bg-white/5 border-white/10 rounded-lg transition-all", accent.refreshHover)}
                                    onClick={() => refresh.mutate(t.id)}
                                    disabled={refresh.isPending}
                                  >
                                    <RefreshCcw size={14} className={cn(refresh.isPending && "animate-spin")} />
                                  </Button>
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
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white", accent.bulkCountBg, accent.checkGlow)}>
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

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0C1319] border border-white/10 text-white rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-xl">Konfirmasi Hapus</AlertDialogTitle>
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

      {/* Template Form Sheet */}
      <TemplateFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        template={selectedTemplate}
        isDesktop={isDesktop}
        hooks={hooks}
        config={config}
        accent={accent}
      />

      {/* Preset Template Sheet */}
      {showPresetButton && (
        <PresetTemplateSheet
          open={templateModalOpen}
          onOpenChange={setTemplateModalOpen}
          existingTemplates={templates}
          isDesktop={isDesktop}
          hooks={hooks}
          accent={accent}
          templatePackages={config.templatePackages}
        />
      )}
    </div>
  )
}
