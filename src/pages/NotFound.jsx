import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FileQuestion, ArrowLeft, Home } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Particles from '../components/reactbits/Particles'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] relative overflow-hidden flex flex-col">
      <Navbar />

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Particles
          particleColors={['#10B981', '#34D399', '#059669']}
          particleCount={30}
          speed={0.2}
          particleBaseSize={1.4}
        />
      </div>
      <div className="fixed top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)] z-0 pointer-events-none" />

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-20 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="relative"
        >
          {/* Large 404 with Gradient */}
          <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 via-white/5 to-transparent select-none">
            404
          </h1>
          
          {/* Floating Icon */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)] backdrop-blur-sm"
          >
            <FileQuestion size={40} className="text-emerald-400" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 space-y-4"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Halaman Hilang</h2>
          <p className="text-[#94A3B8] max-w-md mx-auto text-sm md:text-base">
            Sepertinya halaman yang Anda cari sudah dipindah, diperbarui, 
            atau mungkin memang belum menetas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <button 
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Kembali
          </button>
          
          <Link 
            to="/"
            className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-black text-sm hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          >
            <Home size={16} />
            Ke Beranda
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  )
}
