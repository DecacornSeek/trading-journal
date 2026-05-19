import { useMemo } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'journal', label: 'Trade Journal', icon: '☰' },
  { id: 'coach', label: 'AI Coach', icon: '◎', badge: 'AI' },
  { id: 'new-trade', label: 'New Trade', icon: '+', cta: true },
  { id: 'calculator', label: 'Position Calc', icon: '◈' },
  { id: 'learnings', label: 'My Learnings', icon: '◉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

const S = {
  aside: {
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 220,
    background: '#0f1117', borderRight: '1px solid #1e2130',
    display: 'flex', flexDirection: 'column', zIndex: 40,
    overflowY: 'auto',
  },
  logo: {
    padding: '20px 16px 16px', borderBottom: '1px solid #1e2130',
    display: 'flex', alignItems: 'center', gap: 10,
  },
  logoIcon: {
    width: 34, height: 34, background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  logoTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 },
  logoSub: { fontSize: 10, color: '#6b7280', fontWeight: 500, letterSpacing: '0.05em' },
  nav: { padding: '12px 8px', flex: 1 },
  item: (active, cta) => ({
    display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
    borderRadius: 7, marginBottom: 2, cursor: 'pointer', border: 'none', width: '100%',
    textAlign: 'left',
    background: cta
      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
      : active ? '#1a1d27' : 'transparent',
    color: cta ? '#fff' : active ? '#e2e8f0' : '#9ca3af',
    fontWeight: cta ? 600 : active ? 600 : 400,
    fontSize: 13.5, transition: 'background 0.15s, color 0.15s',
  }),
  icon: (active, cta) => ({
    fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0,
    color: cta ? '#fff' : active ? '#22c55e' : '#6b7280',
  }),
  badge: {
    marginLeft: 'auto', background: '#7c3aed', color: '#e9d5ff',
    fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
    letterSpacing: '0.04em',
  },
  bottom: { padding: '12px 12px 16px', borderTop: '1px solid #1e2130' },
  statRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: { fontSize: 11, color: '#6b7280' },
  statVal: (color) => ({ fontSize: 13, fontWeight: 600, color: color || '#e2e8f0' }),
  streak: {
    marginTop: 10, padding: '7px 10px', borderRadius: 7,
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    fontSize: 11.5, color: '#f87171', lineHeight: 1.4,
  },
};

export default function Sidebar({ page, navigateTo, trades }) {
  const stats = useMemo(() => {
    const real = trades.filter(t => t.trade_type === 'real' && t.status === 'closed');
    const wins = real.filter(t => t.win_loss === 'win');
    const winRate = real.length ? Math.round((wins.length / real.length) * 100) : 0;
    const totalPnl = real.reduce((s, t) => s + (t.pnl_dollars || 0), 0);

    // Today's PnL
    const today = new Date().toDateString();
    const todayPnl = real
      .filter(t => new Date(t.date).toDateString() === today)
      .reduce((s, t) => s + (t.pnl_dollars || 0), 0);

    // Week PnL (Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekPnl = real
      .filter(t => new Date(t.date) >= monday)
      .reduce((s, t) => s + (t.pnl_dollars || 0), 0);

    // Loss streak
    const sorted = [...real].sort((a, b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    for (const t of sorted) {
      if (t.win_loss === 'loss') streak++;
      else break;
    }

    return { winRate, totalPnl, todayPnl, weekPnl, streak };
  }, [trades]);

  const fmt = (n) => {
    const sign = n >= 0 ? '+' : '';
    return `${sign}$${Math.abs(n).toFixed(0)}`;
  };

  return (
    <aside style={S.aside}>
      <div style={S.logo}>
        <div style={S.logoIcon}>📈</div>
        <div>
          <div style={S.logoTitle}>TradeLog</div>
          <div style={S.logoSub}>NCI SYSTEM</div>
        </div>
      </div>

      <nav style={S.nav}>
        {NAV_ITEMS.map(item => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              style={S.item(active, item.cta)}
              onClick={() => navigateTo(item.id)}
            >
              <span style={S.icon(active, item.cta)}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span style={S.badge}>{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div style={S.bottom}>
        <div style={S.statRow}>
          <span style={S.statLabel}>Today P&L</span>
          <span style={S.statVal(stats.todayPnl >= 0 ? '#22c55e' : '#ef4444')}>
            {fmt(stats.todayPnl)}
          </span>
        </div>
        <div style={S.statRow}>
          <span style={S.statLabel}>This Week</span>
          <span style={S.statVal(stats.weekPnl >= 0 ? '#22c55e' : '#ef4444')}>
            {fmt(stats.weekPnl)}
          </span>
        </div>
        <div style={S.statRow}>
          <span style={S.statLabel}>Win Rate</span>
          <span style={S.statVal('#e2e8f0')}>{stats.winRate}%</span>
        </div>
        {stats.streak >= 2 && (
          <div style={S.streak}>
            ⚠ {stats.streak} consecutive losses. Take a break.
          </div>
        )}
      </div>
    </aside>
  );
}
