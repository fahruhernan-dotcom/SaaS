import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MapPin, Clock, Info, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatIDR } from '../../lib/format';
import TopBar from '../components/TopBar';

export default function HargaPasar() {
  const [prices, setPrices] = useState([
    { region: 'Jawa Barat', price: 21500, trend: 'up', change: 200 },
    { region: 'Jawa Tengah', price: 20800, trend: 'down', change: 100 },
    { region: 'Jawa Timur', price: 21200, trend: 'stable', change: 0 },
    { region: 'Jabodetabek', price: 22100, trend: 'up', change: 300 },
  ]);

  useEffect(() => {
    const channel = supabase
      .channel('prices-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_prices' }, payload => {
        // Logic to update state from payload
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div style={{ background: '#06090F', minHeight: '100vh', paddingBottom: '20px' }}>
      <TopBar title="Harga Pasar" subtitle="Update live harga farm gate" />

      {/* Live Banner */}
      <div style={{ padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(16,185,129,0.2)'
        }}>
          <Zap size={24} color="white" fill="white" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>Update Terakhir</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Baru saja · Berdasarkan Pinsar/GOPAN</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: 'white', fontWeight: 800 }}>LIVE</div>
        </div>
      </div>

      <main style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 800, color: '#F1F5F9' }}>Regional Pricing</h3>
          <span style={{ fontSize: '12px', color: '#4B6478' }}>Rp / kg</span>
        </div>

        {prices.map((p, i) => (
          <PriceCard key={i} data={p} />
        ))}

        <div style={{ marginTop: '20px', padding: '16px', background: '#111C24', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="#10B981" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#F1F5F9' }}>Disclaimer Harga</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.5 }}>
            Harga yang ditampilkan adalah referensi rata-rata pasar. Harga riil dapat berbeda tergantung pada kualitas ayam, bobot rata-rata, dan jarak farm.
          </p>
        </div>
      </main>
    </div>
  );
}

function PriceCard({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: '#111C24',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={20} color="#4B6478" />
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#F1F5F9' }}>{data.region}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {data.trend === 'up' && <TrendingUp size={12} color="#10B981" />}
            {data.trend === 'down' && <TrendingDown size={12} color="#F87171" />}
            <span style={{ fontSize: '11px', color: data.trend === 'up' ? '#10B981' : data.trend === 'down' ? '#F87171' : '#4B6478', fontWeight: 700 }}>
              {data.change !== 0 ? `${data.trend === 'up' ? '+' : '-'}${data.change}` : 'Stabil'}
            </span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9' }}>{data.price.toLocaleString()}</div>
        <div style={{ fontSize: '10px', color: '#4B6478', fontWeight: 700 }}>HARI INI</div>
      </div>
    </motion.div>
  );
}
