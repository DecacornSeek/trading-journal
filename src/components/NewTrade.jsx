import { useState } from 'react';
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
const SETUP_MODELS = ['Trend Continuation', 'Liquidity Sweep Reversal', 'Break & Retest', 'Range Reversal', 'Breakout', 'Other'];
const MARKET_REGIMES = ['Balance', 'Aggressive Trend', 'Transition', 'Breakout', 'Reversal', 'High Volatility', 'Low Volatility'];
const EXECUTION_CONTEXTS = ['Focused', 'At Work', 'Distracted', 'Emotional'];
const EXIT_REASONS = ['Take Profit', 'Stop Loss', 'Manual — Plan', 'Manual — Fear', 'Trailing Stop', 'Time Exit', 'Rule Violation', 'Other'];
const NEWS_RISKS = ['Clear', 'Scheduled — trade around it', 'Avoid — event risk'];
const GAP_TYPES = ['None', 'Breakaway / fundamental', 'Technical / likely close', 'Unclear'];
const VPOC_FLOWS = ['Rising', 'Falling', 'Flat', 'Mixed / unclear'];
const CASH_OPEN_READS = ['Aligned with road map', 'Contradicts road map', 'Narrow / low information', 'Not open yet', 'Not applicable'];
const ORDER_FLOW_PROOFS = ['PbD structure', 'Speed through LVN', 'Lethargy / rejection at LVN', 'Absorption', 'Front-running reversal', 'Footprint imbalance', 'Other'];
const ORDER_FLOW_BEHAVIORS = ['Speed / aggressive participation', 'Lethargy / no interest', 'Absorption', 'Front-running', 'Mixed / unclear'];
const EXECUTION_STYLES = ['Single A-to-B', 'Fragmented toward B'];
const SCREENSHOT_LIMIT = 4;
const MAX_SCREENSHOT_BYTES = 400 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}.`));
    };
    image.src = url;
  });
}

async function compressScreenshot(file) {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);

  const image = await loadImage(file);
  const scale = Math.min(1, 1440 / image.naturalWidth, 900 / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is not available in this browser.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.78;
  let dataUrl = canvas.toDataURL('image/webp', quality);
  while (dataUrl.length * 0.75 > MAX_SCREENSHOT_BYTES && quality > 0.38) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/webp', quality);
  }
  if (dataUrl.length * 0.75 > MAX_SCREENSHOT_BYTES) {
    throw new Error(`${file.name} is still too large after compression.`);
  }

  return {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    dataUrl,
    addedAt: new Date().toISOString(),
  };
}

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

function ScreenshotManager({ phase, screenshots, processing, error, onAdd, onRemove }) {
  const label = phase === 'pre' ? 'pre-trade' : 'post-trade';
  return (
    <>
      <div
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault();
          onAdd(event.dataTransfer.files, phase);
        }}
        style={{
          border: `1px dashed ${C.border2}`, borderRadius: 9, padding: 16,
          background: '#0f1117', marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 7,
            background: C.blue, color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: processing ? 'wait' : 'pointer',
          }}>
            {processing ? 'Processing...' : `+ Add ${label} screenshots`}
            <input
              type="file" accept="image/*" multiple hidden disabled={processing}
              onChange={event => {
                onAdd(event.target.files, phase);
                event.target.value = '';
              }}
            />
          </label>
          <span style={{ fontSize: 12, color: C.dim }}>
            Drop {label} chart images here · {screenshots.length}/{SCREENSHOT_LIMIT}
          </span>
        </div>
        {error && <div style={{ color: C.red, fontSize: 12, marginTop: 9 }}>{error}</div>}
      </div>
      {screenshots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {screenshots.map(screenshot => (
            <div key={screenshot.id} style={{
              border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', background: C.card,
            }}>
              <img src={screenshot.dataUrl} alt={screenshot.name || `${label} trade chart`} style={{
                display: 'block', width: '100%', height: 120, objectFit: 'cover',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px' }}>
                <span title={screenshot.name} style={{
                  minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', color: C.muted, fontSize: 11.5,
                }}>
                  {screenshot.name || 'Chart screenshot'}
                </span>
                <button type="button" onClick={() => onRemove(screenshot.id, phase)} style={{
                  border: 'none', background: 'transparent', color: C.red,
                  padding: 2, fontSize: 11.5, cursor: 'pointer',
                }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ChecklistPanel({ answers, onChange }) {
  const isComplete = (question, answer) => answer === 'yes' || (question.naAllowed && answer === 'na');
  const totalChecked = CHECKLIST_QUESTIONS.filter((question, index) => isComplete(question, answers[index])).length;
  const blockingNo = CHECKLIST_QUESTIONS.some((question, index) => question.blocker && answers[index] === 'no');
  const allComplete = totalChecked === CHECKLIST_QUESTIONS.length;
  const result = blockingNo ? 'no_trade' : allComplete ? 'go' : 'caution';

  const resultColor = result === 'go' ? C.green : result === 'caution' ? C.yellow : C.red;
  const resultLabel = result === 'go' ? 'GO' : result === 'caution' ? 'CAUTION' : 'NO TRADE';

  return { panel: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {CHECKLIST_QUESTIONS.map((q, i) => (
        <div key={q.id} style={{
          padding: '10px 0', borderBottom: `1px solid ${C.border}`,
          background: q.blocker && answers[i] === 'no' ? 'rgba(239,68,68,0.07)' : 'transparent',
        }}>
          <div style={{ fontSize: 12.5, color: C.text, marginBottom: 7, lineHeight: 1.4 }}>
            {q.text}
            {q.blocker && <span style={{ color: C.red, marginLeft: 4, fontSize: 11 }}>●</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['yes', 'no', ...(q.naAllowed ? ['na'] : [])].map(v => (
              <button key={v} onClick={() => onChange(i, v)} style={{
                flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: answers[i] === v
                  ? `1px solid ${v === 'yes' ? C.green : v === 'no' ? C.red : C.yellow}`
                  : `1px solid ${C.border2}`,
                background: answers[i] === v
                  ? v === 'yes' ? 'rgba(34,197,94,0.15)' : v === 'no' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'
                  : 'transparent',
                color: answers[i] === v
                  ? v === 'yes' ? C.green : v === 'no' ? C.red : C.yellow
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
          {totalChecked}/{CHECKLIST_QUESTIONS.length} completed
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
  exit_date: '',
  status: 'closed', win_loss: 'win',
  pnl_dollars: '', pnl_currency: 'USD', actual_rr: '',
  confidence: 3, discipline: 3,
  pre_notes: '', post_notes: '',
  tags: [], session: '', btc_outlook: '',
  checklist_score: 0, checklist_result: 'caution',
  checklist_answers: [],
  pre_emotion: '', post_emotion: '',
  pre_screenshots: [], post_screenshots: [],
  challenge_trade: false,
  setup_model: '', market_regime: '', execution_context: 'Focused',
  news_risk: '', gap_type: 'None', vpoc_flow: '',
  business_zone_a: '', business_zone_b: '', daily_roadmap: '',
  cash_open_read: '', orderflow_proof: '', orderflow_behavior: '',
  execution_style: 'Single A-to-B',
  position_size: '', planned_risk_dollars: '', estimated_costs: '',
  account_balance_before: '', account_equity_before: '',
  actual_costs: '', mae_dollars: '', mfe_dollars: '',
  exit_reason: '', plan_adherence: '', rule_violation_notes: '',
};

function createInitialForm(editTrade, settings) {
  if (!editTrade) return {
    ...EMPTY,
    challenge_trade: settings?.challengeEnabled !== false,
    planned_risk_dollars: settings?.challengeRiskPerTrade || '',
    account_balance_before: settings?.challengeCurrentBalance || '',
    account_equity_before: settings?.challengeCurrentEquity || '',
  };
  const { screenshots, ...trade } = editTrade;
  const initial = {
    ...EMPTY,
    ...trade,
    pre_screenshots: trade.pre_screenshots || screenshots || [],
    post_screenshots: trade.post_screenshots || [],
  };
  for (const [key, defaultValue] of Object.entries(EMPTY)) {
    if (typeof defaultValue === 'string' && initial[key] == null) initial[key] = defaultValue;
  }
  return initial;
}

export default function NewTrade({ tags, editTrade, settings, onSave }) {
  const [phase, setPhase] = useState('pre');
  const [form, setForm] = useState(() => createInitialForm(editTrade, settings));
  const [checkAnswers, setCheckAnswers] = useState(() => (
    editTrade?.checklist_answers?.length === CHECKLIST_QUESTIONS.length
      ? [...editTrade.checklist_answers]
      : Array(CHECKLIST_QUESTIONS.length).fill(null)
  ));
  const [saved, setSaved] = useState(false);
  const [screenshotErrors, setScreenshotErrors] = useState({ pre: '', post: '' });
  const [processingPhase, setProcessingPhase] = useState(null);
  const [saveError, setSaveError] = useState('');

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  // Auto-calc planned R:R
  const calcRR = (entry, sl, tp) => {
    const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(tp);
    if (!e || !s || !t || e === s) return '';
    const rr = Math.abs((t - e) / (e - s));
    return rr.toFixed(2);
  };

  const plannedRR = calcRR(form.entry_price, form.stop_loss, form.take_profit);
  const netPnl = parseFloat(form.pnl_dollars);
  const plannedRisk = parseFloat(form.planned_risk_dollars);
  const realizedR = Number.isFinite(netPnl) && plannedRisk > 0 ? netPnl / plannedRisk : null;

  const toggleTag = (name) => {
    set('tags', form.tags.includes(name)
      ? form.tags.filter(t => t !== name)
      : [...form.tags, name]);
  };

  const addScreenshots = async (files, screenshotPhase) => {
    const field = `${screenshotPhase}_screenshots`;
    const remaining = SCREENSHOT_LIMIT - (form[field] || []).length;
    if (remaining <= 0) {
      setScreenshotErrors(current => ({
        ...current,
        [screenshotPhase]: `A trade can have up to ${SCREENSHOT_LIMIT} ${screenshotPhase}-trade screenshots.`,
      }));
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) return;
    setProcessingPhase(screenshotPhase);
    setScreenshotErrors(current => ({ ...current, [screenshotPhase]: '' }));
    try {
      const screenshots = [];
      for (const file of selected) screenshots.push(await compressScreenshot(file));
      setForm(current => ({
        ...current,
        [field]: [...(current[field] || []), ...screenshots],
      }));
      if (files.length > remaining) {
        setScreenshotErrors(current => ({
          ...current,
          [screenshotPhase]: `Only the first ${remaining} screenshot${remaining === 1 ? '' : 's'} were added.`,
        }));
      }
    } catch (error) {
      setScreenshotErrors(current => ({ ...current, [screenshotPhase]: error.message }));
    } finally {
      setProcessingPhase(null);
    }
  };

  const removeScreenshot = (id, screenshotPhase) => {
    const field = `${screenshotPhase}_screenshots`;
    setForm(current => ({
      ...current,
      [field]: (current[field] || []).filter(screenshot => screenshot.id !== id),
    }));
    setScreenshotErrors(current => ({ ...current, [screenshotPhase]: '' }));
  };

  const handleCheckAnswer = (i, val) => {
    const next = [...checkAnswers];
    next[i] = val;
    setCheckAnswers(next);
  };

  const { panel, result, score } = ChecklistPanel({ answers: checkAnswers, onChange: handleCheckAnswer });

  const handleSave = () => {
    if (form.challenge_trade) {
      const missing = [];
      if (!form.setup_model) missing.push('setup model');
      if (!form.daily_roadmap.trim()) missing.push('daily road map');
      if (!form.orderflow_proof) missing.push('order-flow proof');
      if (!(parseFloat(form.position_size) > 0)) missing.push('position size');
      if (!(parseFloat(form.stop_loss) > 0)) missing.push('hard stop');
      if (!(parseFloat(form.planned_risk_dollars) > 0)) missing.push('planned dollar risk');
      if (result !== 'go') missing.push('completed 11-point GO checklist');
      if (form.status !== 'open' && !form.plan_adherence) missing.push('plan adherence');
      if (missing.length) {
        setSaveError(`Challenge trade needs: ${missing.join(', ')}.`);
        return;
      }
    }

    const trade = {
      ...form,
      id: form.id || Date.now(),
      entry_price: parseFloat(form.entry_price) || 0,
      stop_loss: parseFloat(form.stop_loss) || 0,
      take_profit: parseFloat(form.take_profit) || 0,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      exit_date: form.exit_date || null,
      pnl_dollars: form.pnl_dollars ? parseFloat(form.pnl_dollars) : null,
      actual_rr: realizedR ?? (form.actual_rr ? parseFloat(form.actual_rr) : null),
      position_size: form.position_size ? parseFloat(form.position_size) : null,
      planned_risk_dollars: form.planned_risk_dollars ? parseFloat(form.planned_risk_dollars) : null,
      estimated_costs: form.estimated_costs ? parseFloat(form.estimated_costs) : null,
      account_balance_before: form.account_balance_before ? parseFloat(form.account_balance_before) : null,
      account_equity_before: form.account_equity_before ? parseFloat(form.account_equity_before) : null,
      actual_costs: form.actual_costs ? parseFloat(form.actual_costs) : null,
      mae_dollars: form.mae_dollars ? parseFloat(form.mae_dollars) : null,
      mfe_dollars: form.mfe_dollars ? parseFloat(form.mfe_dollars) : null,
      checklist_result: result,
      checklist_score: score,
      checklist_answers: checkAnswers,
      status: form.win_loss ? 'closed' : 'open',
    };
    if (!trade.win_loss || form.status === 'open') {
      trade.status = 'open';
      trade.win_loss = null;
    }
    setSaveError('');
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

            <Section title="EDGE CLASSIFICATION" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <Label>Primary setup *</Label>
                <select value={form.setup_model} onChange={e => set('setup_model', e.target.value)} style={inp}>
                  <option value="">— Select —</option>
                  {SETUP_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                </select>
              </div>
              <div>
                <Label>Market regime</Label>
                <select value={form.market_regime} onChange={e => set('market_regime', e.target.value)} style={inp}>
                  <option value="">— Select —</option>
                  {MARKET_REGIMES.map(regime => <option key={regime} value={regime}>{regime}</option>)}
                </select>
              </div>
              <div>
                <Label>Execution context</Label>
                <select value={form.execution_context} onChange={e => set('execution_context', e.target.value)} style={inp}>
                  {EXECUTION_CONTEXTS.map(context => <option key={context} value={context}>{context}</option>)}
                </select>
              </div>
            </div>

            <Section title="MARKET CONTEXT & ROAD MAP" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['News risk', 'news_risk', NEWS_RISKS],
                ['Gap classification', 'gap_type', GAP_TYPES],
                ['Weekly VPOC flow', 'vpoc_flow', VPOC_FLOWS],
                ['Cash-open read', 'cash_open_read', CASH_OPEN_READS],
                ['Order-flow proof *', 'orderflow_proof', ORDER_FLOW_PROOFS],
                ['Observed behavior', 'orderflow_behavior', ORDER_FLOW_BEHAVIORS],
                ['Execution approach', 'execution_style', EXECUTION_STYLES],
              ].map(([label, key, options]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <select value={form[key]} onChange={e => set(key, e.target.value)} style={inp}>
                    {!['gap_type', 'execution_style'].includes(key) && <option value="">— Select —</option>}
                    {options.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <Label>Business zone A</Label>
                <input value={form.business_zone_a} onChange={e => set('business_zone_a', e.target.value)}
                  placeholder="Entry / support / resistance area" style={inp} />
              </div>
              <div>
                <Label>Business zone B</Label>
                <input value={form.business_zone_b} onChange={e => set('business_zone_b', e.target.value)}
                  placeholder="Destination / opposing value area" style={inp} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Label>Daily road map *</Label>
              <textarea value={form.daily_roadmap} onChange={e => set('daily_roadmap', e.target.value)}
                rows={4} style={{ ...inp, resize: 'vertical', lineHeight: 1.55 }}
                placeholder="Where should price move fast, rotate sideways, reject, or continue? What invalidates the map?" />
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

            <Section title="POSITION & ACCOUNT RISK" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Position size *', 'position_size', 'e.g. 0.05 BTC'],
                ['Planned total risk ($) *', 'planned_risk_dollars', 'Stop loss + expected costs'],
                ['Estimated costs ($)', 'estimated_costs', 'Commission + slippage'],
                ['Balance before trade ($)', 'account_balance_before', '10000'],
                ['Equity before trade ($)', 'account_equity_before', '10000'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <input type="number" step="any" min="0" value={form[key] ?? ''}
                    onChange={e => set(key, e.target.value)} style={inp} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <Label>Planned risk % of equity</Label>
                <input readOnly value={parseFloat(form.account_equity_before) > 0 && plannedRisk > 0
                  ? `${((plannedRisk / parseFloat(form.account_equity_before)) * 100).toFixed(2)}%`
                  : '—'} style={{ ...inp, background: '#0b0d14', color: C.muted }} />
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

            <Section title="CHART SCREENSHOTS" />
            <ScreenshotManager
              phase="pre" screenshots={form.pre_screenshots || []}
              processing={processingPhase === 'pre'} error={screenshotErrors.pre}
              onAdd={addScreenshots} onRemove={removeScreenshot}
            />

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
            <div style={{ marginBottom: 14 }}>
              <Label>Account classification</Label>
              <ToggleBtn
                value={form.challenge_trade ? 'challenge' : 'other'}
                onChange={value => set('challenge_trade', value === 'challenge')}
                options={[
                  { value: 'challenge', label: 'Challenge trade', activeColor: C.blue },
                  { value: 'other', label: 'Other / historical', activeColor: C.muted },
                ]}
              />
            </div>
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
                <Label>Close Date & Time</Label>
                <input type="datetime-local" value={form.exit_date || ''}
                  onChange={e => set('exit_date', e.target.value)} style={inp} />
              </div>
              <div>
                <Label>Net P&L after costs ({form.pnl_currency === 'EUR' ? '€' : '$'})</Label>
                <input type="number" step="any" value={form.pnl_dollars || ''}
                  onChange={e => set('pnl_dollars', e.target.value)} style={inp} placeholder="+120" />
              </div>
              <div>
                <Label>Realized R</Label>
                <input value={realizedR !== null ? `${realizedR.toFixed(2)}R` : '—'} readOnly
                  style={{ ...inp, background: '#0b0d14', color: C.muted }} />
              </div>
            </div>

            <Section title="EXECUTION ANALYTICS" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                ['Actual costs ($)', 'actual_costs', 'Fees + funding + slippage'],
                ['MAE ($)', 'mae_dollars', 'Worst unrealized loss'],
                ['MFE ($)', 'mfe_dollars', 'Best unrealized profit'],
              ].map(([label, key, placeholder]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <input type="number" step="any" min="0" value={form[key] ?? ''}
                    onChange={e => set(key, e.target.value)} style={inp} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <Label>Exit reason</Label>
                <select value={form.exit_reason} onChange={e => set('exit_reason', e.target.value)} style={inp}>
                  <option value="">— Select —</option>
                  {EXIT_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Label>Followed original plan? *</Label>
                <ToggleBtn value={form.plan_adherence} onChange={value => set('plan_adherence', value)} options={[
                  { value: 'yes', label: 'Yes', activeColor: C.green },
                  { value: 'partial', label: 'Partly', activeColor: C.yellow },
                  { value: 'no', label: 'No', activeColor: C.red },
                ]} />
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
            <div style={{ marginTop: 14 }}>
              <Label>Rule violation or deviation</Label>
              <input value={form.rule_violation_notes} onChange={e => set('rule_violation_notes', e.target.value)}
                placeholder="Leave blank if none; otherwise name the exact rule" style={inp} />
            </div>

            <Section title="POST-TRADE SCREENSHOTS" />
            <ScreenshotManager
              phase="post" screenshots={form.post_screenshots || []}
              processing={processingPhase === 'post'} error={screenshotErrors.post}
              onAdd={addScreenshots} onRemove={removeScreenshot}
            />
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
          CONTEXT-FIRST CHECKLIST
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
            {saveError && (
              <div style={{ color: C.red, fontSize: 12.5, marginRight: 'auto', alignSelf: 'center' }}>{saveError}</div>
            )}
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
