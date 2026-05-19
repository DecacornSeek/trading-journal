import { useState } from 'react';

const C = {
  card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

const inp = {
  background: '#0f1117', border: `1px solid ${C.border2}`, borderRadius: 7,
  color: C.text, padding: '8px 12px', fontSize: 13.5, outline: 'none',
  fontFamily: 'inherit', width: '100%',
};

function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 5 }}>{children}</label>;
}

// ─── Core calculator logic ────────────────────────────────────────────────────
function CalcBody({ compact, onUseInTrade }) {
  const [portfolio, setPortfolio] = useState('10000');
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');

  const portfolioNum = parseFloat(portfolio) || 0;
  const entryNum = parseFloat(entry) || 0;
  const slNum = parseFloat(sl) || 0;
  const tpNum = parseFloat(tp) || 0;

  const riskAmount = portfolioNum * (riskPct / 100);
  const slPips = Math.abs(entryNum - slNum);
  const positionSize = slPips > 0 ? riskAmount / slPips : 0;
  const rr = slPips > 0 && tpNum ? Math.abs((tpNum - entryNum) / slPips) : 0;
  const potentialProfit = positionSize * Math.abs(tpNum - entryNum);
  const leverage = portfolioNum > 0 ? (positionSize * entryNum) / portfolioNum : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 16 }}>
      {!compact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Label>Portfolio Size ($)</Label>
            <input type="number" value={portfolio} onChange={e => setPortfolio(e.target.value)} style={inp} />
          </div>
          <div>
            <Label>Risk %: {riskPct}%</Label>
            <input type="range" min={0.1} max={5} step={0.1} value={riskPct}
              onChange={e => setRiskPct(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: C.blue, marginTop: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
              <span style={{ fontSize: 10, color: C.dim }}>0.1%</span>
              <span style={{ fontSize: 10, color: C.dim }}>5%</span>
            </div>
          </div>
        </div>
      )}
      {compact && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>Portfolio</Label>
            <input type="number" value={portfolio} onChange={e => setPortfolio(e.target.value)} style={{ ...inp, fontSize: 12.5 }} />
          </div>
          <div>
            <Label>Risk % ({riskPct}%)</Label>
            <input type="range" min={0.1} max={5} step={0.1} value={riskPct}
              onChange={e => setRiskPct(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: C.blue, marginTop: 8 }} />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: compact ? 8 : 12 }}>
        {[['Entry', entry, setEntry], ['Stop Loss', sl, setSl], ['Take Profit (opt)', tp, setTp]].map(([label, val, setter]) => (
          <div key={label}>
            <Label>{label}</Label>
            <input type="number" step="any" value={val} onChange={e => setter(e.target.value)}
              style={{ ...inp, fontSize: compact ? 12.5 : 13.5 }} placeholder="0.0" />
          </div>
        ))}
      </div>

      {/* Results */}
      {positionSize > 0 && (
        <div style={{
          background: '#0f1117', border: `1px solid ${C.border2}`, borderRadius: 10,
          padding: compact ? 12 : 16,
        }}>
          <div style={{ textAlign: 'center', marginBottom: compact ? 8 : 12 }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>POSITION SIZE</div>
            <div style={{ fontSize: compact ? 22 : 30, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>
              {positionSize.toLocaleString('en-US', { maximumFractionDigits: 4 })}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>units / contracts</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['$ at Risk', `$${riskAmount.toFixed(2)}`, C.red],
              ['Leverage', `${leverage.toFixed(1)}x`, C.yellow],
              ['R:R Ratio', rr > 0 ? `${rr.toFixed(2)}:1` : '—', rr >= 2 ? C.green : C.muted],
              ['Potential Profit', potentialProfit > 0 ? `$${potentialProfit.toFixed(2)}` : '—', C.green],
            ].map(([label, val, color]) => (
              <div key={label} style={{
                background: C.card, borderRadius: 8, padding: '8px 10px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 10.5, color: C.dim, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color }}>{val}</div>
              </div>
            ))}
          </div>
          {!compact && onUseInTrade && (
            <button onClick={() => onUseInTrade({ entry, sl, tp, positionSize })} style={{
              marginTop: 12, width: '100%', background: C.blue, color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 0', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            }}>
              → Use in Trade Entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Full-page calculator ─────────────────────────────────────────────────────
export function Calculator({ navigateTo }) {
  return (
    <div style={{ padding: '0 24px 40px', maxWidth: 640 }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 20 }}>
          Position Size Calculator
        </div>
        <CalcBody compact={false} onUseInTrade={() => navigateTo('new-trade')} />
      </div>
    </div>
  );
}

// ─── Floating calculator ──────────────────────────────────────────────────────
export function FloatingCalc() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 50,
        width: 46, height: 46, borderRadius: '50%', border: 'none',
        background: open ? C.blue : '#1a1d27',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        color: C.text, fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s',
      }} title="Position Calculator">
        {open ? '✕' : '◈'}
      </button>
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 24, zIndex: 49,
          width: 360, background: C.card, border: `1px solid ${C.border2}`,
          borderRadius: 14, padding: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 14, fontSize: 13 }}>
            ◈ Position Calculator
          </div>
          <CalcBody compact={true} />
        </div>
      )}
    </>
  );
}
