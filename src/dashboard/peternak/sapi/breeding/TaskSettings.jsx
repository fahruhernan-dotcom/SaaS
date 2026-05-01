import React, { useState, useMemo } from 'react'
import { 
  Settings2, Wand2, Plus, Trash2, Save, 
  ChevronRight, Calendar, ClipboardList, Info, 
  Clock, AlertCircle, AlertTriangle, Sparkles,
  LayoutGrid, MapPin, Scale, Utensils, Syringe,
  Activity, Heart, RefreshCw, CheckCircle2,
  MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  usePeternakTaskTemplates,
  useUpsertTaskTemplate,
  useDeleteTaskTemplate,
  useAssignableMembers
} from '@/lib/hooks/usePeternakTaskData'
import { BrokerPageHeader } from '@/dashboard/_shared/components/transactions/BrokerPageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import LoadingSpinner from '@/dashboard/_shared/components/LoadingSpinner'
import { cn } from '@/lib/utils'

// ─── Config ───────────────────────────────────────────────────────────────────

const TASK_TYPE_OPTIONS = [
  { value: 'pemberian_pakan', label: 'Pemberian Pakan', icon: Utensils,      color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { value: 'timbang',         label: 'Penimbangan',     icon: Scale,         color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  { value: 'vaksinasi',       label: 'Vaksinasi',       icon: Syringe,       color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { value: 'kebersihan_kandang',label: 'Kebersihan',     icon: Trash2,        color: 'text-emerald-400',bg: 'bg-emerald-500/10' },
  { value: 'kesehatan',       label: 'Pengecekan Sehat',icon: Activity,      color: 'text-pink-400',   bg: 'bg-pink-500/10' },
  { value: 'reproduksi',      label: 'Reproduksi',      icon: Heart,         color: 'text-rose-400',   bg: 'bg-rose-500/10' },
  { value: 'lainnya',         label: 'Lainnya',         icon: ClipboardList, color: 'text-slate-400',  bg: 'bg-white/5' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily',   label: 'Harian' },
  { value: 'weekly',  label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
]

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function SapiBreedingTaskSettings() {
  const livestockType = 'sapi_breeding'
  const [isAdding, setIsAdding] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const { data: templates = [], isLoading, refetch } = usePeternakTaskTemplates({ livestockType })
  const { data: members = [] } = useAssignableMembers()
  const upsertTemplate = useUpsertTaskTemplate()
  const deleteTemplate = useDeleteTaskTemplate()

  const handleSave = async (formData) => {
    try {
      await upsertTemplate.mutateAsync({
        ...formData,
        livestock_type: livestockType
      })
      toast.success('Template tugas disimpan')
      setIsAdding(false)
      setEditingTemplate(null)
      refetch()
    } catch (err) {
      toast.error('Gagal menyimpan template')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus template ini?')) return
    try {
      await deleteTemplate.mutateAsync(id)
      toast.success('Template dihapus')
      refetch()
    } catch (err) {
      toast.error('Gagal menghapus template')
    }
  }

  if (isLoading) return <LoadingSpinner fullPage />

  return (
    <div className="min-h-screen bg-[#060B10] text-slate-200 pb-24">
      <BrokerPageHeader 
        title="Pengaturan Tugas (Sapi Breeding)" 
        subtitle="Otomasi jadwal dan standar operasional kandang"
      >
        <Button 
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20"
        >
          <Plus size={16} className="mr-2" />
          Tambah Aturan
        </Button>
      </BrokerPageHeader>

      <div className="px-6 lg:px-8 max-w-[1200px] mx-auto mt-8 space-y-6">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <Settings2 size={48} className="text-slate-600 mb-4 opacity-20" />
            <p className="text-slate-400 font-medium">Belum ada aturan tugas otomatis</p>
            <p className="text-slate-500 text-sm mt-1">Buat template untuk mengotomasi tugas harian tim kandang</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {templates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => handleDelete(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      <TemplateDialog 
        open={isAdding || !!editingTemplate} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false)
            setEditingTemplate(null)
          }
        }}
        template={editingTemplate}
        onSave={handleSave}
        members={members}
      />
    </div>
  )
}

function TemplateCard({ template, onEdit, onDelete }) {
  const typeCfg = TASK_TYPE_OPTIONS.find(o => o.value === template.task_type) || TASK_TYPE_OPTIONS[TASK_TYPE_OPTIONS.length - 1]
  const TypeIcon = typeCfg.icon

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A1118] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-white/10 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border border-white/5', typeCfg.bg)}>
          <TypeIcon className={typeCfg.color} size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
            {template.title}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <RefreshCw size={10} /> {template.frequency === 'daily' ? 'Harian' : template.frequency}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> {template.preferred_time || 'Kapan saja'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <MapPin size={10} /> {template.kandang_name || 'Semua Kandang'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5">
          <Settings2 size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10">
          <Trash2 size={16} />
        </Button>
      </div>
    </motion.div>
  )
}

function TemplateDialog({ open, onOpenChange, template, onSave, members }) {
  const [formData, setFormData] = useState({
    title: '',
    task_type: 'pemberian_pakan',
    frequency: 'daily',
    preferred_time: '07:00',
    kandang_name: '',
    default_assignee_worker_id: '',
    is_active: true,
  })

  React.useEffect(() => {
    if (template) {
      setFormData({
        id: template.id,
        title: template.title || '',
        task_type: template.task_type || 'pemberian_pakan',
        frequency: template.frequency || 'daily',
        preferred_time: template.preferred_time || '07:00',
        kandang_name: template.kandang_name || '',
        default_assignee_worker_id: template.default_assignee_worker_id || '',
        is_active: template.is_active ?? true,
      })
    } else {
      setFormData({
        title: '',
        task_type: 'pemberian_pakan',
        frequency: 'daily',
        preferred_time: '07:00',
        kandang_name: '',
        default_assignee_worker_id: '',
        is_active: true,
      })
    }
  }, [template, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F171F] border-white/10 text-white max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Aturan Tugas' : 'Tambah Aturan Tugas'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Judul Tugas</Label>
            <Input 
              placeholder="Contoh: Pakan Pagi" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Tugas</Label>
              <Select value={formData.task_type} onValueChange={v => setFormData({ ...formData, task_type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121D27] border-white/10 text-slate-200">
                  {TASK_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#121D27] border-white/10 text-slate-200">
                  {FREQUENCY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Waktu (Pilihan)</Label>
              <Input 
                type="time"
                value={formData.preferred_time}
                onChange={e => setFormData({ ...formData, preferred_time: e.target.value })}
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Kandang (Opsional)</Label>
              <Input 
                placeholder="Nama Kandang"
                value={formData.kandang_name}
                onChange={e => setFormData({ ...formData, kandang_name: e.target.value })}
                className="bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Penanggung Jawab</Label>
            <Select value={formData.default_assignee_worker_id} onValueChange={v => setFormData({ ...formData, default_assignee_worker_id: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder="Pilih Anggota Tim" />
              </SelectTrigger>
              <SelectContent className="bg-[#121D27] border-white/10 text-slate-200">
                <SelectItem value="none">Otomatis (Tanpa Penugasan)</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label>Status Aktif</Label>
              <p className="text-[10px] text-slate-500">Tugas akan otomatis digenerate jika aktif</p>
            </div>
            <Switch 
              checked={formData.is_active}
              onCheckedChange={v => setFormData({ ...formData, is_active: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => onSave(formData)} className="bg-blue-600 text-white rounded-xl">Simpan Aturan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
