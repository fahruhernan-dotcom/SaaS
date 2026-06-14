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
      name: "Koordinasi Tim",
      excel: "Kirim File via WA",
      ternakos: "Tim Update Serentak",
      icon: <Clock size={16} />,
      win: "ternakos"
    }
  ];

  return (
    <section className="bg-bg-base py-20 px-5 border-t border-border-subtle relative overflow-hidden">
      
      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatedContent direction="vertical" distance={20}>
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-normal text-text-primary tracking-tight mb-3">
              Kenapa Pindah Dari <span className="text-emerald-500">Excel?</span>
            </h2>
            <p className="text-text-secondary text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
              Sudah saatnya meninggalkan cara lama yang menghambat pertumbuhan bisnis Anda.
            </p>
          </div>
        </AnimatedContent>

        <div className="bg-bg-1 rounded-2xl border border-border-default overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="grid grid-cols-12 border-b border-border-default bg-bg-2/50">
            <div className="col-span-6 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-medium text-text-muted tracking-wide flex items-center">
              Kategori Perbandingan
            </div>
            <div className="col-span-3 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-medium text-text-muted tracking-wide flex items-center justify-center gap-2">
              <FileSpreadsheet size={15} className="hidden md:block text-text-muted" />
              Excel / WhatsApp
            </div>
            <div className="col-span-3 md:col-span-4 p-4 md:p-5 font-display text-[10px] md:text-xs font-medium text-emerald-600 dark:text-emerald-400 tracking-wide flex items-center justify-center gap-2 bg-emerald-500/5 border-l border-border-default">
              <Zap size={14} className="hidden md:block text-emerald-500" />
              TernakOS
            </div>
          </div>

          {/* Feature Rows */}
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="grid grid-cols-12 border-b border-border-subtle last:border-0 hover:bg-bg-2/40 transition-colors"
            >
              <div className="col-span-6 md:col-span-4 p-4 md:p-5 flex items-center gap-3">
                <div className="hidden md:flex w-7 h-7 rounded-lg bg-bg-2 border border-border-subtle items-center justify-center text-text-secondary">
                  {React.cloneElement(f.icon, { size: 13 })}
                </div>
                <span className="text-[12px] md:text-[14px] font-medium text-text-primary leading-tight">{f.name}</span>
              </div>
              
              <div className="col-span-3 md:col-span-4 p-4 md:p-5 flex flex-col items-center justify-center text-center border-l border-border-subtle">
                <X size={15} className="text-text-muted mb-0.5" />
                <span className="text-[10px] md:text-[12px] font-normal text-text-secondary leading-tight text-center">{f.excel}</span>
              </div>

              <div className="col-span-3 md:col-span-4 p-4 md:p-5 flex flex-col items-center justify-center text-center bg-emerald-500/[0.02] border-l border-border-subtle">
                <Check size={15} className="text-emerald-600 dark:text-emerald-400 mb-0.5" strokeWidth={3} />
                <span className="text-[10px] md:text-[12px] font-medium text-emerald-600 dark:text-emerald-400 leading-tight text-center">{f.ternakos}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Panel */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-2xl bg-bg-2 border border-border-default shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap size={18} fill="currentColor" />
            </div>
            <div className="text-left">
              <h4 className="font-display text-sm md:text-base font-normal text-text-primary leading-tight">Siap Migrasi?</h4>
              <p className="text-[13px] text-text-secondary font-medium">Kami bantu import data Excel pertama Anda secara gratis.</p>
            </div>
          </div>
          <a 
            href="/register"
            className="w-full md:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-medium text-sm rounded-[99px] transition-all shadow-md active:scale-95 text-center"
          >
            Mulai Migrasi Sekarang
          </a>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
