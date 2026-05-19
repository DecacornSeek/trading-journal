import { useState, useEffect } from 'react';
import { CHECKLIST_QUESTIONS } from '../data/sampleData';

const C = {
  bg: '#131722', card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  purple: '#a78bfa', text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

const inp = {
  background: '#0f1117', border: `1px solid ${C.border2}`, borderRadius: 7,
  color: C.text, padding: '8px 12px', fontSize: 13.5, outline: 'none',
  fontFamily: 'inherit', width: '100%',
};

const PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF',
  'GBPJPY', 'EURJPY', 'BTCUSD', 'ETHUSD', 'SOLUSDT', 'WIFUSDT', 'GOLD',
  'US30', 'NAS100', 'SPX500',
];
const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D'];
const SESSIONS = ['London', 'NY', 'Asia', 'London/NY Overlap'];

function Label({ children }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 5 }}>
      {children}
    </label>
  );
}

function ToggleBtn({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border2}` }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, background: value === opt.value ? opt.activeColor || C.blue : 'transparent',
          color: value === opt.value ? '#fff' : C.muted,
          border: 'none', padding: '8px 0', fontSize: 13, fontWeight: value === opt.value ? 600 : 400,
          cursor: 'pointer', transition: 'background 0.15s',
        }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SliderField({ label, value, onChange, min = 1, max = 5 }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <Label>{label}</Label>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{value}/{max}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.blue }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: C.dim }}>Low</span>
        <span style={{ fontSize: 10, color: C.dim }}>High</span>
      </div>
    </div>
  );
}

function Section({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: '0.08em' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function ChecklistPanel({ answers, onChange }) {
  const score = CHECKLIST_QUESTIONS.reduce((s, q, i) => {
    if (!q.auto_red) return s + (answers[i] === 'yes' ? 1 : 0);
    return s;
  }, 0);

  // Auto no-trade conditions
  const q5yes = answers[5] === 'yes'; // revenge trade
  const q6no = answers[6] === 'no'; // not following system
  const autoNoTrade = q5yes || q6no;

  const adjustedScore = autoNoTrade ? 0 : score;
  const result = autoNoTrade ? 'no_trade' : score >= 5 ? 'go' : score >= 3 ? 'caution' : 'no_trade';
  const totalChecked = CHECKLIST_QUESTIONS.filter((q, i) => !q.auto_red && answers[i] === 'yes').length;

  const resultColor = result === 'go' ? C.green : result === 'caution' ? C.yellow : C.red;
  const resultLabel = result === 'go' ? 'GO' : result === 'caution' ? 'CAUTION' : 'NO TRADE';

  return { panel: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {CHECKLIST_QUESTIONS.map((q, i) => (
        <div key={q.id} style={{
          padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          background: q.auto_red && answers[i] === 'yes' ? 'rgba(239,68,68,0.07)' : 'transparent',
        }}>
          <div style={{ fontSize: 12.5, color: C.text, marginBottom: 7, lineHeight: 1.4 }}>
            {q.text}
            {q.auto_red && <span style={{ color: C.red, marginLeft: 4, fontSize: 11 }}>⚠</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['yes', 'no'].map(v => (
              <button key={v} onClick={() => onChange(i, v)} style={{
                flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: answers[i] === v
                  ? `1px solid ${v === 'yes' ? (q.auto_red ? C.red : C.green) : C.red}`
                  : `1px solid ${C.border2}`,
                background: answers[i] === v
                  ? v === 'yes' ? (q.auto_red ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)') : 'rgba(239,68,68,0.15)'
                  : 'transparent',
                color: answers[i] === v
                  ? v === 'yes' ? (q.auto_red ? C.red : C.green) : C.red
                  : C.dim,
                cursor: 'pointer',
              }}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 9, textAlign: 'center',
        background: `${resultColor}18`, border: `1px solid ${resultColor}40`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: resultColor }}>{resultLabel}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
          {totalChecked}/5 criteria met
        </div>
      </div>
    </div>
  ), result, score: totalChecked };
}

// ─── Main NewTrade form ───────────────────────────────────────────────────────
const EMPTY = {
  trade_type: 'real', date: new Date().toISOString().slice(0, 16),
  pair: '', direction: 'long', timeframe: '15m',
  entry_price: '', stop_loss: '', take_profit: '', exit_price: '',
  status: 'closed', win_loss: 'win',
  pnl_dollars: '', actual_rr: '',
  confidence: 3, discipline: 3,
  pre_notes: '', post_notes: '',
  tags: [], session: '', btc_outlook: '',
  checklist_score: 0, checklist_result: 'caution',
  pre_emotion: '', post_emotion: '',
};

export default function NewTrade({ tags, editTrade, onSave }) {
  const [phase, setPhase] = useState('pre');
  const [form, setForm] = useState(() => editTrade ? { ...EMPTY, ...editTrade } : { ...EMPTY });
  const [checkAnswers, setCheckAnswers] = useState(Array(7).fill(null));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (editTrade) setForm({ ...EMPTY, ...editTrade });
  }, [editTrade]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Auto-calc planned R:R
  const calcRR = (entry, sl, tp) => {
    const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
    if (!e || !s || !t || e === s) return '';
    const rr = Math.abs((t - e) / (e - s));
    return rr.toFixed(2);
  };

  const plannedRR = calcRR(form.entry_price, form.stop_loss, form.take_profit);

  const toggleTag = (name) => {
    set('tags', form.tags.includes(name)
      ? form.tags.filter(t => t !== name)
      : [...form.tags, name]);
  };

  const handleCheckAnswer = (i, val) => {
    const next = [...checkAnswers];
    next[i] = val;
    setCheckAnswers(next);
  };

  const { panel, result, score } = ChecklistPanel({ answers: checkAnswers, onChange: handleCheckAnswer });

  const handleSave = () => {
    const trade = {
      ...form,
      id: form.id || Date.now(),
      entry_price: parseFloat(form.entry_price) || 0,
      stop_loss: parseFloat(form.stop_loss) || 0,
      take_profit: parseFloat(form.take_profit) || 0,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      pnl_dollars: form.pnl_dollars ? parseFloat(form.pnl_dollars) : null,
      actual_rr: form.actual_rr ? parseFloat(form.actual_rr) : null,
      checklist_result: result,
      checklist_score: score,
      status: form.win_loss ? 'closed' : 'open',
    };
    if (!trade.win_loss || form.status === 'open') {
      trade.status = 'open';
      trade.win_loss = null;
    }
    onSave(trade);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fieldStyle = { marginBottom: 14 };

  return (
    <div style={{ padding: '0 24px 80px', display: 'flex', gap: 20 }}>
      {/* Main form area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Phase tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: `1px solid ${C.border2}`, borderRadius: 9, overflow: 'hidden', width: 'fit-content' }}>
          {[['pre', '① Pre-Trade'], ['post', '② Post-Trade']].map(([p, label]) => (
            <button key={p} onClick={() => setPhase(p)} style={{
              padding: '8px 22px', background: phase === p ? C.blue : 'transparent',
              color: phase === p ? '#fff' : C.muted,
              border: 'none', fontWeight: phase === p ? 600 : 400, fontSize: 13.5,
              cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>

        {phase === 'pre' && (
          <>
            <Section title="TRADE SETUP" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Instrument</Label>
                <input list="pairs-dl" value={form.pair} onChange={e => set('pair', e.target.value)}
                  placeholder="EURUSD" style={inp} />
                <datalist id="pairs-dl">{PAIRS.map(p => <option key={p} value={p} />)}</datalist>
              </div>
              <div>
                <Label>Date & Time</Label>
                <input type="datetime-local" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
              </div>
              <div>
                <Label>Direction</Label>
                <ToggleBtn value={form.direction} onChange={v => set('direction', v)} options={[
                  { value: 'long', label: 'Long', activeColor: C.green },
                  { value: 'short', label: 'Short', activeColor: C.red },
                ]} />
              </div>
              <div>
                <Label>Timeframe</Label>
                <select value={form.timeframe} onChange={e => set('timeframe', e.target.value)} style={inp}>
                  {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                </select>
              </div>
              <div>
                <Label>Trade Type</Label>
                <ToggleBtn value={form.trade_type} onChange={v => set('trade_type', v)} options={[
                  { value: 'real', label: 'Real', activeColor: C.blue },
                  { value: 'paper', label: 'Paper', activeColor: C.muted },
                ]} />
              </div>
              <div>
                <Label>Session</Label>
                <select value={form.session} onChange={e => set('session', e.target.value)} style={inp}>
                  <option value="">— Select —</option>
                  {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <Section title="PRICE LEVELS" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              {[
                ['Entry Price', 'entry_price'],
                ['Stop Loss', 'stop_loss'],
                ['Take Profit', 'take_profit'],
              ].map(([label, key]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <input type="number" step="any" value={form[key]}
                    onChange={e => set(key, e.target.value)} style={inp} placeholder="0.0000" />
                </div>
              ))}
              <div>
                <Label>Planned R:R</Label>
                <input value={plannedRR || '—'} readOnly style={{ ...inp, background: '#0b0d14', color: C.muted }} />
              </div>
            </div>

            <Section title="CONFIDENCE & NOTES" />
            <div style={{ ...fieldStyle, maxWidth: 300 }}>
              <SliderField label="Confidence" value={form.confidence} onChange={v => set('confidence', v)} />
            </div>
            <div style={fieldStyle}>
              <Label>Pre-Trade Notes (1) Reason 2) Setup 3) Bias)</Label>
              <textarea value={form.pre_notes} onChange={e => set('pre_notes', e.target.value)}
                rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                placeholder="1) HTF trend aligned&#10;2) BOS confirmed on 15m&#10;3) FVG at entry zone" />
            </div>

            <Section title="TAGS" />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tags.map(tag => {
                const active = form.tags.includes(tag.name);
                return (
                  <button key={tag.id} onClick={() => toggleTag(tag.name)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
                    background: active ? `${tag.color}22` : 'transparent',
                    border: active ? `1px solid ${tag.color}88` : `1px solid ${C.border2}`,
                    color: active ? tag.color : C.muted,
                    fontWeight: active ? 600 : 400,
                  }}>
                    {tag.name}
                  </button>
                );
              })}
            </div>

            <Section title="OPTIONAL" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>BTC Outlook</Label>
                <ToggleBtn value={form.btc_outlook} onChange={v => set('btc_outlook', form.btc_outlook === v ? '' : v)} options={[
                  { value: 'Bullish', label: 'Bullish', activeColor: C.green },
                  { value: 'Neutral', label: 'Neutral', activeColor: C.yellow },
                  { value: 'Bearish', label: 'Bearish', activeColor: C.red },
                ]} />
              </div>
              <div>
                <Label>Pre-trade emotion</Label>
                <input value={form.pre_emotion} onChange={e => set('pre_emotion', e.target.value)}
                  placeholder="e.g. Calm, FOMO, Confident…" style={inp} />
              </div>
            </div>
          </>
        )}

        {phase === 'post' && (
          <>
            <Section title="TRADE RESULT" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Label>Result</Label>
                <ToggleBtn value={form.win_loss || 'open'} onChange={v => {
                  if (v === 'open') { set('win_loss', null); set('status', 'open'); }
                  else { set('win_loss', v); set('status', 'closed'); }
                }} options={[
                  { value: 'win', label: 'Win', activeColor: C.green },
                  { value: 'loss', label: 'Loss', activeColor: C.red },
                  { value: 'open', label: 'Open', activeColor: C.yellow },
                ]} />
              </div>
              <div>
                <Label>Exit Price</Label>
                <input type="number" step="any" value={form.exit_price || ''}
                  onChange={e => set('exit_price', e.target.value)} style={inp} placeholder="0.0000" />
              </div>
              <div>
                <Label>P&L ($)</Label>
                <input type="number" step="any" value={form.pnl_dollars || ''}
                  onChange={e => set('pnl_dollars', e.target.value)} style={inp} placeholder="+120" />
              </div>
              <div>
                <Label>Actual R:R</Label>
                <input type="number" step="0.01" value={form.actual_rr || ''}
                  onChange={e => set('actual_rr', e.target.value)} style={inp} placeholder="2.0" />
              </div>
            </div>

            <Section title="REVIEW" />
            <div style={{ ...fieldStyle, maxWidth: 300 }}>
              <SliderField label="Discipline" value={form.discipline || 3} onChange={v => set('discipline', v)} />
            </div>
            <div style={fieldStyle}>
              <Label>Post-Trade Notes</Label>
              <textarea value={form.post_notes} onChange={e => set('post_notes', e.target.value)}
                rows={5} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
                placeholder="What went right? What would you do differently?" />
            </div>
            <div>
              <Label>Post-trade emotion</Label>
              <input value={form.post_emotion} onChange={e => set('post_emotion', e.target.value)}
                placeholder="e.g. Relieved, Frustrated, Euphoric…" style={inp} />
            </div>
          </>
        )}
      </div>

      {/* Checklist sidebar */}
      <div style={{
        width: 280, flexShrink: 0, position: 'sticky', top: 72, alignSelf: 'flex-start',
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16,
        maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, marginBottom: 14, letterSpacing: '0.08em' }}>
          PRE-TRADE CHECKLIST
        </div>
        {panel}
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 220, right: 0,
        background: '#0f1117', borderTop: `1px solid ${C.border}`,
        padding: '12px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, zIndex: 30,
      }}>
        {phase === 'pre' ? (
          <button onClick={() => setPhase('post')} style={{
            background: C.blue, color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            Add Result →
          </button>
        ) : (
          <>
            <button onClick={() => setPhase('pre')} style={{
              background: 'transparent', color: C.muted,
              border: `1px solid ${C.border2}`, borderRadius: 8,
              padding: '9px 18px', fontSize: 14, cursor: 'pointer',
            }}>
              ← Pre-Trade
            </button>
            <button onClick={handleSave} style={{
              background: saved ? C.green : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              {saved ? '✓ Saved!' : 'Save Trade'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
