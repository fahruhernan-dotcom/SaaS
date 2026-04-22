import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getAllPosts, formatDate } from '../data/blogPosts';
import { useSEO } from '@/lib/hooks/useSEO';

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'all', label: 'Semua Artikel', emoji: '📚' },
  { value: 'peternak', label: 'Peternak', emoji: '🐔' },
  { value: 'broker', label: 'Broker', emoji: '🤝' },
  { value: 'sembako', label: 'Sembako', emoji: '🌾' },
  { value: 'umum', label: 'Umum', emoji: '💡' },
];

const CATEGORY_COLORS = {
  peternak: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  broker: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  sembako: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  umum: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

// ─── Animation helpers ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

// ─── Blog Card ─────────────────────────────────────────────────────────────────

function BlogCard({ post }) {
  const cat = CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS.umum;
  return (
    <motion.article
      variants={cardVariants}
      className="group bg-[#0C1319] rounded-2xl border border-white/8 hover:border-emerald-500/25 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Category accent bar */}
      <div className={`h-1 w-full ${cat.bg} ${cat.text}`} />

      {/* Hero image — shown only if post has one */}
      {post.image && (
        <div className="overflow-hidden h-48 w-full">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Category badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
            <Tag size={9} />
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-[#F1F5F9] font-bold text-lg leading-snug mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        <p className="text-[#4B6478] text-sm leading-relaxed mb-5 line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 text-[11px] text-[#4B6478]">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {post.readTime} menit
            </span>
          </div>
          <Link
            to={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group/link"
          >
            Baca
            <ArrowRight size={13} className="group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const allPosts = useMemo(() => getAllPosts(), []);

  const filtered = useMemo(
    () => activeCategory === 'all' ? allPosts : allPosts.filter(p => p.category === activeCategory),
    [allPosts, activeCategory]
  );

  useSEO({
    title: 'Blog & Panduan Peternakan Indonesia - TernakOS',
    description: 'Tips manajemen kandang, cara hitung FCR & IP Score, panduan broker ayam, dan strategi bisnis peternakan Indonesia dari praktisi nyata di lapangan.',
    path: '/blog',
  });

  return (
    <div className="min-h-screen bg-[#06090F] text-[#F1F5F9] font-sans overflow-x-hidden">
      <Navbar />

      <main className="pt-20">
        {/* HERO */}
        <section className="relative py-20 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.07)_0%,transparent_65%)]" />
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
                <BookOpen size={12} />
                Artikel & Panduan Peternakan
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-5">
                Blog & Panduan<br />
                <span className="text-emerald-400">TernakOS</span>
              </h1>
              <p className="text-[#94A3B8] text-lg leading-relaxed max-w-2xl mx-auto">
                Tips praktis untuk peternak, broker, dan agen sembako Indonesia. Semua artikel ditulis berdasarkan pengalaman nyata di lapangan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CATEGORY FILTER */}
        <section className="px-6 pb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={activeCategory === cat.value
                    ? { background: '#10B981', color: '#fff', border: '1px solid #10B981' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* POSTS GRID */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-24 text-[#4B6478]">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold">Belum ada artikel di kategori ini.</p>
              </div>
            ) : (
              <motion.div
                key={activeCategory}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filtered.map(post => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
