import { useState, useMemo } from 'react';

const C = {
  bg: '#131722', card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

// ─── Gauge arc component ────────────────────────────────────────────────────
function GaugeArc({ pct, color, size = 110 }) {
  const r = (size / 2) - 12;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const circumference = Math.PI * r; // half circle
  const offset = circumference * (1 - Math.min(Math.max(pct / 100, 0), 1));
  const startX = cx - r;
  const endX = cx + r;
  return (
    <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
      <path
        d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`}
        fill="none" stroke="#1e2130" strokeWidth={10} strokeLinecap="round"
      />
      <path
        d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`}
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

function GaugeCard({ label, trades, color }) {
  const closed = trades.filter(t => t.status === 'closed');
  const wins = closed.filter(t => t.win_loss === 'win');
  const losses = closed.filter(t => t.win_loss === 'loss');
  const pct = closed.length ? Math.round((wins.length / closed.length) * 100) : 0;
  const pnl = closed.reduce((s, t) => s + (t.pnl_dollars || 0), 0);

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
      padding: '16px 18px', flex: 1, minWidth: 150,
    }}>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <GaugeArc pct={pct} color={color} size={100} />
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: -4 }}>{pct}%</div>
        <div style={{ fontSize: 12, color: C.muted }}>
          <span style={{ color: C.green }}>{wins.length}W</span>
          {' / '}
          <span style={{ color: C.red }}>{losses.length}L</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: pnl >= 0 ? C.green : C.red, marginTop: 2 }}>
          {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────
function Calendar({ trades }) {
  const [offset, setOffset] = useState(0);
  const today = new Date();
  const viewDate = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  // Build day→pnl map for real closed trades
  const dayMap = useMemo(() => {
    const m = {};
    trades.forEach(t => {
      if (t.trade_type !== 'real' || t.status !== 'closed') return;
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      m[key] = (m[key] || 0) + (t.pnl_dollars || 0);
    });
    return m;
  }, [trades, year, month]);

  const cells = [];
  // empty cells for first dow
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayDay = today.getDate();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontWeight: 600, color: C.text }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setOffset(o => o - 1)} style={btnStyle}>‹</button>
          <button onClick={() => setOffset(0)} style={btnStyle}>Today</button>
          <button onClick={() => setOffset(o => o + 1)} style={btnStyle}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: C.dim, padding: '2px 0', fontWeight: 500 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const pnl = dayMap[day];
          const isToday = isThisMonth && day === todayDay;
          let bg = 'transparent';
          if (pnl !== undefined) bg = pnl >= 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)';
          return (
            <div key={day} style={{
              height: 44, borderRadius: 6, background: bg,
              border: isToday ? `2px solid ${C.blue}` : '1px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: 12,
            }}>
              <span style={{ color: isToday ? C.blue : C.muted, fontWeight: isToday ? 700 : 400 }}>{day}</span>
              {pnl !== undefined && (
                <span style={{ fontSize: 10, color: pnl >= 0 ? C.green : C.red, fontWeight: 600 }}>
                  {pnl >= 0 ? '+' : ''}{Math.abs(pnl) >= 1000 ? `${(pnl / 1000).toFixed(1)}k` : pnl.toFixed(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = {
  background: '#1e2130', color: '#9ca3af', border: '1px solid #2a2e39',
  borderRadius: 6, padding: '3px 9px', fontSize: 12, cursor: 'pointer',
};

// ─── Insight strip ────────────────────────────────────────────────────────────
function computeInsights(trades) {
  const insights = [];
  const real = trades.filter(t => t.trade_type === 'real' && t.status === 'closed');
  if (!real.length) return insights;

  // Revenge trade danger
  const revengeCount = real.filter(t => t.tags?.includes('Revenge Trade')).length;
  if (revengeCount >= 1) {
    insights.push({ type: 'danger', text: `${revengeCount} revenge trade(s) detected. Pattern is costing you money.` });
  }

  // Low-discipline losses
  const lowDiscLosses = real.filter(t => t.win_loss === 'loss' && (t.discipline || 0) <= 2).length;
  if (lowDiscLosses >= 2) {
    insights.push({ type: 'warn', text: `${lowDiscLosses} losses had discipline ≤2. Review trade management habits.` });
  }

  // News day losses
  const newsDayLosses = real.filter(t => t.win_loss === 'loss' && t.tags?.includes('News Day')).length;
  if (newsDayLosses >= 1) {
    insights.push({ type: 'warn', text: `${newsDayLosses} losses on news days. Consider sitting out scheduled events.` });
  }

  // FVG win rate
  const fvgTrades = real.filter(t => t.tags?.includes('FVG'));
  if (fvgTrades.length >= 3) {
    const fvgWins = fvgTrades.filter(t => t.win_loss === 'win').length;
    const wr = Math.round((fvgWins / fvgTrades.length) * 100);
    if (wr >= 65) {
      insights.push({ type: 'good', text: `FVG setups have a ${wr}% win rate for you — keep prioritizing them.` });
    }
  }

  // Short direction losses
  const shorts = real.filter(t => t.direction === 'short');
  if (shorts.length >= 3) {
    const shortLosses = shorts.filter(t => t.win_loss === 'loss').length;
    const pct = Math.round((shortLosses / shorts.length) * 100);
    if (pct >= 60) {
      insights.push({ type: 'warn', text: `Short trades are losing ${pct}% of the time. Check your short bias setups.` });
    }
  }

  // Loss streak
  const sorted = [...real].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  for (const t of sorted) {
    if (t.win_loss === 'loss') streak++;
    else break;
  }
  if (streak >= 3) {
    insights.push({ type: 'danger', text: `${streak} consecutive losses. Mandatory cool-down before next trade.` });
  }

  return insights.slice(0, 4);
}

const typeColor = { good: '#22c55e', warn: '#f59e0b', danger: '#ef4444' };
const typeBg = { good: 'rgba(34,197,94,0.1)', warn: 'rgba(245,158,11,0.1)', danger: 'rgba(239,68,68,0.1)' };
const typeIcon = { good: '✓', warn: '⚠', danger: '✕' };

// ─── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: '14px 16px', flex: 1, minWidth: 100,
    }}>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || C.text, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function Dashboard({ trades, navigateTo }) {
  const real = trades.filter(t => t.trade_type === 'real' && t.status === 'closed');
  const wins = real.filter(t => t.win_loss === 'win');
  const losses = real.filter(t => t.win_loss === 'loss');
  const winRate = real.length ? Math.round((wins.length / real.length) * 100) : 0;

  const totalPnl = real.reduce((s, t) => s + (t.pnl_dollars || 0), 0);
  const grossWin = wins.reduce((s, t) => s + (t.pnl_dollars || 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl_dollars || 0), 0));
  const profitFactor = grossLoss ? (grossWin / grossLoss).toFixed(2) : wins.length ? '∞' : '0';
  const avgRR = real.length
    ? (real.filter(t => t.actual_rr).reduce((s, t) => s + (t.actual_rr || 0), 0) / real.filter(t => t.actual_rr).length || 0).toFixed(2)
    : '—';
  const bestTrade = wins.length ? Math.max(...wins.map(t => t.pnl_dollars || 0)) : 0;
  const worstTrade = losses.length ? Math.min(...losses.map(t => t.pnl_dollars || 0)) : 0;

  const longs = trades.filter(t => t.direction === 'long');
  const shorts = trades.filter(t => t.direction === 'short');
  const insights = useMemo(() => computeInsights(trades), [trades]);

  return (
    <div style={{ padding: '0 24px 32px' }}>
      {/* Stat bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <StatCard label="Win Rate" value={`${winRate}%`}
          color={winRate >= 55 ? C.green : winRate >= 45 ? C.yellow : C.red} />
        <StatCard label="Profit Factor" value={profitFactor}
          color={parseFloat(profitFactor) >= 1.5 ? C.green : parseFloat(profitFactor) >= 1 ? C.yellow : C.red} />
        <StatCard label="Avg R:R" value={avgRR} />
        <StatCard label="Total P&L" value={`${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl)}`}
          color={totalPnl >= 0 ? C.green : C.red} />
        <StatCard label="Best Trade" value={`+$${bestTrade}`} color={C.green} />
        <StatCard label="Worst Trade" value={`-$${Math.abs(worstTrade)}`} color={C.red} />
        <StatCard label="Total Trades" value={real.length} sub={`${wins.length}W / ${losses.length}L`} />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              flex: 1, minWidth: 220, padding: '10px 14px', borderRadius: 9,
              background: typeBg[ins.type], border: `1px solid ${typeColor[ins.type]}40`,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ color: typeColor[ins.type], fontWeight: 700, marginTop: 1 }}>{typeIcon[ins.type]}</span>
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gauges + Calendar */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column', minWidth: 340 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <GaugeCard label="Long" trades={longs} color={C.green} />
            <GaugeCard label="Short" trades={shorts} color={C.red} />
            <GaugeCard label="Overall" trades={trades} color={C.blue} />
          </div>
          {/* Recent trades mini-list */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: C.text, fontSize: 13.5 }}>Recent Trades</div>
            {trades.length === 0 && (
              <div style={{ color: C.dim, fontSize: 13 }}>No trades yet.</div>
            )}
            {[...trades].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(t => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <span style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{t.pair}</span>
                  <span style={{ fontSize: 11, color: t.direction === 'long' ? C.green : C.red, marginLeft: 6 }}>
                    {t.direction.toUpperCase()}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {t.status === 'open' ? (
                    <span style={{ fontSize: 12, color: C.yellow }}>OPEN</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600, color: (t.pnl_dollars || 0) >= 0 ? C.green : C.red }}>
                      {(t.pnl_dollars || 0) >= 0 ? '+' : ''}${Math.abs(t.pnl_dollars || 0)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <button
              onClick={() => navigateTo('journal')}
              style={{
                marginTop: 10, background: 'none', border: 'none', color: C.blue,
                fontSize: 12, cursor: 'pointer', padding: 0,
              }}
            >
              View all trades →
            </button>
          </div>
        </div>
        <div style={{ flex: 2, minWidth: 300 }}>
          <Calendar trades={trades} />
        </div>
      </div>
    </div>
  );
}
