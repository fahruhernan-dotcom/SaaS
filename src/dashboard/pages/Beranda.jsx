import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Clock, BarChart2, Home as HomeIcon,
         AlertCircle, ChevronRight, CheckCircle, MoreVertical, 
         Package, ClipboardList, Truck, AlertTriangle, TrendingDown,
         Zap, LayoutDashboard, Users, Settings, X, Info } from 'lucide-react'
import { useAuth } from '../../lib/hooks/useAuth'
import { useDashboardStats } from '../../lib/hooks/useDashboardStats'
import { useChickenBatches } from '../../lib/hooks/useChickenBatches'
import { useForecast } from '../../lib/hooks/useForecast'
import { useDeliveries } from '../../lib/hooks/useDeliveries'
import { formatIDRShort, formatDateFull, formatEkor } from '../../lib/format'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect } from 'react'

import FormJualModal from '../forms/FormJualModal'
import FormBeliModal from '../forms/FormBeliModal'

export default function Beranda() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  const { data: stats, isLoading } = useDashboardStats()
  const { data: readyBatches } = useChickenBatches('ready')
  const { data: forecast } = useForecast()
  const { data: deliveries } = useDeliveries('on_route')

  const [showBeli, setShowBeli] = useState(false)
  const [showJual, setShowJual] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  // Realtime Subscription
  useEffect(() => {
    const channel = supabase
      .channel('beranda-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_prices' }, 
        () => queryClient.invalidateQueries({ queryKey: ['market-prices'] })
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          toast.info('📋 Order baru masuk dari buyer!')
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'deliveries' }, 
        () => queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [queryClient])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 18 ? 'sore' : 'malam'
  const firstName = profile?.full_name?.split(' ')[0] || 'Broker'

  const handleTandaiLunas = async (rpaId, salesData) => {
    try {
      const { error } = await supabase.from('sales')
        .update({ payment_status: 'lunas', paid_amount: salesData.total_revenue })
        .eq('rpa_id', rpaId)
        .eq('payment_status', 'belum_lunas')
        .eq('is_deleted', false)

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Piutang ditandai lunas! ✅')
    } catch (err) {
      toast.error('Gagal update. Coba lagi.')
    }
  }

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>

      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'linear-gradient(180deg, #0C1319 0%, #06090F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#4B6478', marginBottom: '2px' }}>
              Selamat {greeting},
            </div>
            <div style={{
              fontFamily: 'Sora',
              fontSize: '20px',
              fontWeight: 800,
              color: '#F1F5F9',
              lineHeight: 1.2,
            }}>
              {firstName}! 👋
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
              borderRadius: '99px',
              padding: '5px 10px',
            }}>
              <div style={{
                width: '6px', height: '6px',
                background: '#10B981',
                borderRadius: '50%',
                animation: 'pulse-dot 2s infinite',
              }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#34D399' }}>Live</span>
            </div>
            
            <button 
              onClick={() => setShowDrawer(true)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#94A3B8'
              }}
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Alert strip */}
        {stats?.topRPADebt?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/rpa')}
          >
            <AlertCircle size={16} color="#F87171" />
            <span style={{ fontSize: '13px', color: '#FCA5A5', flex: 1 }}>
              {stats.rpaWithDebtCount} RPA masih punya piutang aktif
            </span>
            <ChevronRight size={14} color="#F87171" />
          </motion.div>
        )}

        {/* 4 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <StatCard
            label="Profit Hari Ini"
            value={isLoading ? '...' : formatIDRShort(stats?.todayProfit || 0)}
            color={stats?.todayProfit >= 0 ? '#34D399' : '#F87171'}
            sub={`rata-rata Rp ${(stats?.avgMarginPerKg || 0).toLocaleString()} /kg`}
            icon={<TrendingUp size={11} color="#4B6478" />}
          />
          <StatCard
            label="Total Piutang"
            value={isLoading ? '...' : formatIDRShort(stats?.totalPiutang || 0)}
            color={stats?.totalPiutang > 0 ? '#F87171' : '#34D399'}
            sub={`${stats?.rpaWithDebtCount || 0} RPA belum bayar`}
            icon={<Clock size={11} color="#4B6478" />}
            onClick={() => navigate('/rpa')}
          />
          <StatCard
            label="Stok Ready"
            value={isLoading ? '...' : formatEkor(readyBatches?.reduce((s, b) => s + b.current_count, 0) || 0)}
            color="#34D399"
            sub="siap panen di farm"
            icon={<Package size={11} color="#4B6478" />}
            onClick={() => navigate('/stok')}
          />
          <StatCard
            label="Order Pending"
            value={isLoading ? '...' : String(forecast?.orders?.filter(o => o.status === 'open').length || 0)}
            color={forecast?.totalDemand > 0 ? '#F87171' : '#34D399'}
            sub="perlu di-match"
            icon={<ClipboardList size={11} color="#4B6478" />}
            onClick={() => navigate('/orders')}
          />
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowBeli(true)}
            style={{
              background: 'rgba(16,185,129,0.10)',
              border: '1px solid rgba(16,185,129,0.20)',
              borderRadius: '12px',
              padding: '14px',
              color: '#34D399',
              fontFamily: 'DM Sans',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            + Catat Beli
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowJual(true)}
            style={{
              background: '#10B981',
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: 'white',
              fontFamily: 'DM Sans',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
            }}
          >
            + Catat Jual
          </motion.button>
        </div>

        {/* --- WIDGET: PENGIRIMAN AKTIF --- */}
        {deliveries?.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="#F59E0B" />
              <span style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>
                Sedang Dikirim ({deliveries.length})
              </span>
            </div>
            {deliveries.map(del => (
              <div key={del.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{del.vehicle_info || 'Truk'} · {del.driver_name}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{del.sales?.purchases?.farms?.farm_name} → {del.sales?.rpa_clients?.rpa_name}</div>
                </div>
                <button 
                  onClick={() => navigate('/pengiriman')}
                  style={{ background: '#F59E0B', color: '#06090F', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700 }}
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        )}

        {/* --- WIDGET: STOK VIRTUAL --- */}
        <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} color="#10B981" />
              <span style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>Stok Tersedia</span>
            </div>
            <span onClick={() => navigate('/stok')} style={{ fontSize: '12px', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}>Lihat Semua →</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {readyBatches?.slice(0, 3).map(batch => (
              <div key={batch.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{batch.farms?.farm_name}</div>
                  <div style={{ fontSize: '11px', color: '#4B6478' }}>{batch.chicken_type} · {batch.avg_weight_kg} kg/ekor</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34D399' }}>{formatEkor(batch.current_count)}</div>
                  <div style={{ fontSize: '11px', color: '#4B6478' }}>Harvest: {formatDate(batch.estimated_harvest_date)}</div>
                </div>
              </div>
            ))}
            {(!readyBatches || readyBatches.length === 0) && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#4B6478' }}>Belum ada stok ready.</div>
            )}
          </div>
        </div>

        {/* --- WIDGET: ORDER PENDING --- */}
        <div style={{ background: '#111C24', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} color="#F87171" />
              <span style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>Order Pending</span>
            </div>
            <span onClick={() => navigate('/orders')} style={{ fontSize: '12px', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}>Kelola Order →</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {forecast?.orders?.filter(o => o.status === 'open').slice(0, 3).map(order => (
              <div key={order.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>{order.rpa_clients?.rpa_name}</div>
                  <div style={{ fontSize: '11px', color: '#4B6478' }}>{formatEkor(order.requested_count)} · {order.chicken_type}</div>
                </div>
                <button 
                  onClick={() => navigate('/orders')}
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                >
                  Match Farm →
                </button>
              </div>
            ))}
            {forecast?.orders?.filter(o => o.status === 'open').length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#4B6478' }}>Tidak ada order pending ✅</div>
            )}
          </div>
        </div>

        {/* Piutang RPA */}
        {stats?.topRPADebt?.length > 0 && (
          <div style={{
            background: '#111C24',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>
                ⏳ Piutang RPA
              </span>
              <span
                onClick={() => navigate('/rpa')}
                style={{ fontSize: '12px', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}
              >
                Lihat Semua →
              </span>
            </div>

            {stats.topRPADebt.map((rpa, i) => (
              <div
                key={rpa.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < stats.topRPADebt.length - 1
                    ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Sora', fontSize: '12px', fontWeight: 800, color: '#34D399',
                  flexShrink: 0,
                }}>
                  {rpa.rpa_name?.slice(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9' }}>
                    {rpa.rpa_name}
                  </div>
                  <div style={{
                    fontSize: '14px', fontWeight: 800,
                    color: '#F87171',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatIDRShort(rpa.total_outstanding)}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTandaiLunas(rpa.id, rpa)}
                  style={{
                    background: 'rgba(16,185,129,0.10)',
                    border: '1px solid rgba(16,185,129,0.20)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#34D399',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CheckCircle size={12} />
                  Lunas
                </motion.button>
              </div>
            ))}
          </div>
        )}

        {/* Hari Ini */}
        <div style={{
          background: '#111C24',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 700, color: '#F1F5F9' }}>
              📋 Hari Ini
            </span>
            <span
              onClick={() => navigate('/transaksi')}
              style={{ fontSize: '12px', color: '#34D399', cursor: 'pointer', fontWeight: 600 }}
            >
              Semua →
            </span>
          </div>

          {!isLoading && stats?.recentTransactions?.length === 0 ? (
            <EmptyState
              icon="🐔"
              title="Belum ada transaksi"
              desc="Catat pembelian atau penjualan pertamamu hari ini"
              action={
                <button
                  onClick={() => setShowJual(true)}
                  style={{
                    background: '#10B981', color: 'white',
                    border: 'none', borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px', fontWeight: 700,
                    fontFamily: 'DM Sans', cursor: 'pointer',
                  }}
                >
                  + Catat Transaksi
                </button>
              }
            />
          ) : (
            stats?.recentTransactions?.slice(0, 5).map((txn, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 700,
                  background: txn.type === 'jual'
                    ? 'rgba(16,185,129,0.12)' : 'rgba(96,165,250,0.12)',
                  color: txn.type === 'jual' ? '#34D399' : '#93C5FD',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}>
                  {txn.type}
                </div>
                <div style={{ flex: 1, fontSize: '13px', color: '#94A3B8' }}>
                  {txn.name || 'Pembelian'}
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: txn.type === 'jual' ? '#34D399' : '#94A3B8',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatIDRShort(txn.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <FormBeliModal isOpen={showBeli} onClose={() => setShowBeli(false)} />
      <FormJualModal isOpen={showJual} onClose={() => setShowJual(false)} />

      {/* Navigation Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ 
                position: 'fixed', top: 0, right: 0, bottom: 0, 
                width: '100%', maxWidth: '280px', 
                background: '#0C1319', 
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                zIndex: 201, padding: '24px 20px',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 800, color: '#F1F5F9' }}>Menu Utama</div>
                <X size={24} color="#4B6478" onClick={() => setShowDrawer(false)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                <DrawerSection title="Operasional">
                  <DrawerItem icon={<ClipboardList size={18}/>} label="Orders" path="/orders" onClick={setShowDrawer} />
                  <DrawerItem icon={<Truck size={18}/>} label="Pengiriman" path="/pengiriman" onClick={setShowDrawer} />
                  <DrawerItem icon={<AlertTriangle size={18}/>} label="Loss Report" path="/loss" onClick={setShowDrawer} />
                  <DrawerItem icon={<HomeIcon size={18}/>} label="Kandang Rekanan" path="/kandangan" onClick={setShowDrawer} />
                </DrawerSection>

                <DrawerSection title="Analisis">
                  <DrawerItem icon={<TrendingUp size={18}/>} label="Cash Flow" path="/cashflow" onClick={setShowDrawer} />
                  <DrawerItem icon={<BarChart2 size={18}/>} label="Harga Pasar" path="/harga-pasar" onClick={setShowDrawer} />
                  <DrawerItem icon={<Zap size={18}/>} label="Forecast" path="/forecast" onClick={setShowDrawer} />
                  <DrawerItem icon={<LayoutDashboard size={18}/>} label="Simulator Margin" path="/simulator" onClick={setShowDrawer} />
                </DrawerSection>

                <DrawerSection title="Akun">
                  <DrawerItem icon={<Users size={18}/>} label="Profil & Tim" path="/akun" onClick={setShowDrawer} />
                  <DrawerItem icon={<Settings size={18}/>} label="Pengaturan" path="/akun" onClick={setShowDrawer} />
                </DrawerSection>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
                <div style={{ fontSize: '12px', color: '#4B6478', textAlign: 'center' }}>TernakOS v1.2.0 · Pro Broker</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '10px', fontWeight: 800, color: '#4B6478', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</div>
    </div>
  )
}

function DrawerItem({ icon, label, path, onClick }) {
  const navigate = useNavigate()
  return (
    <motion.button
      whileTap={{ scale: 0.98, background: 'rgba(255,255,255,0.05)' }}
      onClick={() => { navigate(path); onClick(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px', borderRadius: '12px',
        background: 'transparent', border: 'none',
        color: '#F1F5F9', textAlign: 'left', cursor: 'pointer',
        width: '100%'
      }}
    >
      <div style={{ color: '#10B981' }}>{icon}</div>
      <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans' }}>{label}</span>
      <ChevronRight size={14} color="#4B6478" style={{ marginLeft: 'auto' }} />
    </motion.button>
  )
}
