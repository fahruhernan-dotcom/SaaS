import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Tablet, FileSpreadsheet, MessageSquare, Zap, Shield, BarChart3, Clock } from 'lucide-react';
import AnimatedContent from '../components/reactbits/AnimatedContent';

const ComparisonTable = () => {
  const features = [
    {
      name: "Kecepatan Input Data",
      excel: "Lambat (Manual)",
      ternakos: "Instan (Auto-sync)",
      icon: <Zap size={16} />,
      win: "ternakos"
    },
    {
      name: "Keamanan Data",
      excel: "Rentan Hilang/Rusak",
      ternakos: "Cloud Backup Aman",
      icon: <Shield size={16} />,
      win: "ternakos"
    },
    {
      name: "Laporan Real-time",
      excel: "Harus Rekap Manual",
      ternakos: "Otomatis 1 Klik",
      icon: <BarChart3 size={16} />,
      win: "ternakos"
    },
    {
      name: "Akses Multi-perangkat",
      excel: "Hanya Laptop/PC",
      ternakos: "HP, Tablet, Laptop",
      icon: <Tablet size={16} />,
      win: "ternakos"
    },
    {
      name: "Kordinasi Tim",
      excel: "Kirim File via WA",
      ternakos: "Tim Update Serentak",
      icon: <Clock size={16} />,
      win: "ternakos"
    }
  ];

  return (
    <section className="bg-[#06090F] py-16 md:py-24 px-5 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatedContent direction="vertical" distance={20}>
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-3">
              KENAPA PINDAH DARI <span className="text-emerald-500">EXCEL?</span>
            </h2>
            <p className="text-[#94A3B8] text-sm max-w-lg mx-auto font-medium leading-relaxed">
              Sudah saatnya meninggalkan cara lama yang menghambat pertumbuhan bisnis Anda.
            </p>
          </div>
        </AnimatedContent>

        <div className="bg-[#111C24] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-white/10 bg-white/[0.02]">
            <div className="col-span-6 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-black text-[#4B6478] uppercase tracking-widest flex items-center">
              FITUR UTAMA
            </div>
            <div className="col-span-3 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-black text-white uppercase tracking-widest flex items-center justify-center gap-2">
              <FileSpreadsheet size={15} className="hidden md:block text-[#4B6478]" />
              EXCEL / WA
            </div>
            <div className="col-span-3 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2 bg-emerald-500/5">
              <Zap size={15} className="hidden md:block" />
              TERNAKOS
            </div>
          </div>

          {/* Feature Rows */}
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-12 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors"
            >
              <div className="col-span-6 md:col-span-4 p-4 md:p-5 flex items-center gap-3">
                <div className="hidden md:flex w-7 h-7 rounded-lg bg-white/5 items-center justify-center text-[#4B6478]">
                  {React.cloneElement(f.icon, { size: 14 })}
                </div>
                <span className="text-[11px] md:text-[13px] font-bold text-[#F1F5F9] leading-tight">{f.name}</span>
              </div>
              
              <div className="col-span-3 md:col-span-4 p-4 md:p-5 flex flex-col items-center justify-center text-center border-l border-white/5">
                <X size={15} className="text-[#4B6478] mb-0.5" />
                <span className="text-[9px] md:text-[11px] font-semibold text-[#4B6478] leading-tight text-center">{f.excel}</span>
              </div>

              <div className="col-span-3 md:col-span-4 p-4 md:p-5 flex flex-col items-center justify-center text-center bg-emerald-500/[0.02] border-l border-white/5">
                <Check size={15} className="text-emerald-500 mb-0.5" strokeWidth={3} />
                <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 leading-tight text-center">{f.ternakos}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-5 p-6 md:p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h4 className="font-display text-base font-black text-white leading-tight uppercase tracking-tight">Siap Migrasi?</h4>
              <p className="text-[13px] text-emerald-400/80 font-medium">Bantu input data Excel pertama Anda secara GRATIS.</p>
            </div>
          </div>
          <a 
            href="#daftar" 
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-display font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            Mulai Migrasi Sekarang
          </a>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
