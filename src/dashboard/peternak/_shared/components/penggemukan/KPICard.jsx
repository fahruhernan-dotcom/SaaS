export function KPICard({ label, value, sub, color = 'text-white', icon: Icon, glow }) {
  const glowMap = {
    green: 'hover:shadow-green-500/10 hover:border-green-500/20',
    amber: 'hover:shadow-amber-500/10 hover:border-amber-500/20',
    red: 'hover:shadow-red-500/10 hover:border-red-500/20',
    emerald: 'hover:shadow-emerald-500/10 hover:border-emerald-500/20',
  }
  const glowClass = glow ? glowMap[glow] ?? '' : ''
  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 transition-all duration-300 shadow-lg ${glowClass}`}>
      {Icon && (
        <div className={`inline-flex items-center justify-center w-6 h-6 rounded-lg mb-2.5 ${
          glow === 'green' ? 'bg-green-500/10' :
          glow === 'amber' ? 'bg-amber-500/10' :
          glow === 'red' ? 'bg-red-500/10' :
          glow === 'emerald' ? 'bg-emerald-500/10' : 'bg-white/5'
        }`}>
          <Icon size={12} className={color} />
        </div>
      )}
      <p className={`font-['Sora'] font-black text-2xl leading-none mb-1 ${color}`}>{value}</p>
      <p className="text-[10px] text-[#4B6478] font-bold uppercase tracking-widest">{label}</p>
      {sub && <p className={`text-[9px] mt-1 font-bold tracking-tight ${glow ? color + '/70' : 'text-[#4B6478]'}`}>{sub}</p>}
    </div>
  )
}
