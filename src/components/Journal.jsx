import { useState, useMemo, useCallback } from 'react';
import { callClaude } from '../lib/claude';
import { CHECKLIST_QUESTIONS } from '../data/sampleData';

const C = {
  bg: '#131722', card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  purple: '#a78bfa', text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

const inp = {
  background: '#0f1117', border: `1px solid ${C.border2}`, borderRadius: 7,
  color: C.text, padding: '7px 11px', fontSize: 13.5, outline: 'none',
  fontFamily: 'inherit',
};

function calcDuration(entry, exit) {
  if (!entry || !exit) return null;
  const ms = new Date(exit) - new Date(entry);
  if (ms <= 0) return null;
  const totalMins = Math.floor(ms / 60000);
  const days = Math.floor(totalMins / 1440);
  const hours = Math.floor((totalMins % 1440) / 60);
  const mins = totalMins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function FilterPill({ label, active, onClick, count }) {
  return (
    <button onClick={onClick} style={{
      background: active ? '#3b82f620' : 'transparent',
      border: active ? `1px solid ${C.blue}` : `1px solid ${C.border2}`,
      color: active ? C.blue : C.muted,
      borderRadius: 20, padding: '4px 12px', fontSize: 12.5, cursor: 'pointer',
      fontWeight: active ? 600 : 400,
    }}>
      {label}{count !== undefined ? ` (${count})` : ''}
    </button>
  );
}

function ConfidenceDots({ value, max = 5, color = C.blue }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: max }, (_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: i < value ? color : C.border2,
        }} />
      ))}
    </div>
  );
}

function TagBadge({ name, tags }) {
  const tag = tags.find(t => t.name === name);
  return (
    <span style={{
      background: `${(tag?.color || C.blue)}22`, color: tag?.color || C.blue,
      border: `1px solid ${(tag?.color || C.blue)}44`,
      borderRadius: 10, padding: '2px 8px', fontSize: 11, fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  );
}

// ─── PM Panel sub-components ──────────────────────────────────────────────────
function PMSkeleton() {
  const barStyle = (w) => ({
    height: 12, borderRadius: 6, marginBottom: 10, width: w,
    background: 'linear-gradient(90deg, #1e2130 25%, #2a2e39 50%, #1e2130 75%)',
    backgroundSize: '200% 100%',
    animation: 'pmShimmer 1.5s infinite',
  });
  return (
    <div style={{ padding: '16px 0' }}>
      {[['80%'], ['60%'], ['70%'], ['55%'], ['75%'], ['40%']].map(([w], i) => (
        <div key={i} style={barStyle(w)} />
      ))}
    </div>
  );
}

function PMList({ items, color }) {
  return (
    <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <span style={{ color, marginTop: 2, flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PMContent({ pm }) {
  const verdictColor = pm.verdict === 'Strong' ? C.green : pm.verdict === 'Caution' ? C.yellow : C.red;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 9,
        background: `${verdictColor}18`, border: `1px solid ${verdictColor}40`,
      }}>
        <span style={{ fontSize: 20 }}>{pm.verdict === 'Strong' ? '✓' : pm.verdict === 'Caution' ? '⚠' : '✕'}</span>
        <div>
          <div style={{ fontWeight: 700, color: verdictColor }}>{pm.verdict} Trade</div>
          {pm.question && <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{pm.question}</div>}
        </div>
      </div>
      {pm.right?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green, marginBottom: 4 }}>WHAT YOU DID RIGHT</div>
          <PMList items={pm.right} color={C.green} />
        </div>
      )}
      {pm.concerns?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.yellow, marginBottom: 4 }}>CONCERNS / IMPROVEMENTS</div>
          <PMList items={pm.concerns} color={C.yellow} />
        </div>
      )}
      {pm.rule_suggestion && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, marginBottom: 4 }}>RULE TO ADD</div>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{pm.rule_suggestion}</div>
        </div>
      )}
    </div>
  );
}

// ─── Trade detail view ────────────────────────────────────────────────────────
function TradeDetail({ trade, tags, learnings, onBack, onEdit }) {
  const [pmState, setPmState] = useState({ status: 'idle', data: null, error: null }); // idle|loading|done|error

  const runPostMortem = useCallback(async () => {
    setPmState({ status: 'loading', data: null, error: null });
    try {
      const payload = JSON.stringify({ trade, learnings }, null, 2);
      const prompt = `You are an NCI method trading coach. Analyse this trade and give a post-mortem.

Trade data:
${payload}

Respond ONLY with valid JSON in this exact shape (no markdown, no extra text):
{
  "verdict": "Strong"|"Caution"|"Weak",
  "right": ["string", ...],
  "concerns": ["string", ...],
  "question": "one reflective question for the trader",
  "rule_suggestion": "one rule to add to their playbook or null"
}`;
      const raw = await callClaude(prompt);
      const json = JSON.parse(raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
      setPmState({ status: 'done', data: json, error: null });
    } catch (e) {
      setPmState({ status: 'error', data: null, error: e.message });
    }
  }, [trade, learnings]);

  const pnlColor = trade.status === 'open' ? C.yellow
    : (trade.pnl_dollars || 0) >= 0 ? C.green : C.red;

  const resultLabel = trade.status === 'open' ? 'OPEN'
    : trade.win_loss === 'win' ? 'WIN' : 'LOSS';

  const checklist = CHECKLIST_QUESTIONS;

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingBottom: 40 }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{
            background: C.card, border: `1px solid ${C.border2}`, color: C.muted,
            borderRadius: 7, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer',
          }}>
            ← Back
          </button>
          <button onClick={onEdit} style={{
            background: C.card, border: `1px solid ${C.border2}`, color: C.text,
            borderRadius: 7, padding: '6px 12px', fontSize: 12.5, cursor: 'pointer',
          }}>
            ✎ Edit
          </button>
          <button onClick={runPostMortem} disabled={pmState.status === 'loading'} style={{
            background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)',
            color: C.purple, borderRadius: 7, padding: '6px 14px', fontSize: 12.5,
            cursor: pmState.status === 'loading' ? 'wait' : 'pointer', marginLeft: 'auto',
            fontWeight: 600,
          }}>
            {pmState.status === 'loading' ? '⏳ Analysing…' : '✦ AI Post-Mortem'}
          </button>
        </div>

        {/* Hero card */}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{trade.pair}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: trade.direction === 'long' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: trade.direction === 'long' ? C.green : C.red,
                }}>
                  {trade.direction.toUpperCase()}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: trade.trade_type === 'real' ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.15)',
                  color: trade.trade_type === 'real' ? C.blue : C.muted,
                }}>
                  {trade.trade_type.toUpperCase()}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, background: '#1e2130', color: C.muted }}>
                  {trade.timeframe}
                </span>
                {trade.session && (
                  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, background: '#1e2130', color: C.muted }}>
                    {trade.session}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {(trade.tags || []).map(tag => <TagBadge key={tag} name={tag} tags={tags} />)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: pnlColor }}>
                {trade.status === 'open' ? 'OPEN'
                  : `${(trade.pnl_dollars || 0) >= 0 ? '+' : ''}$${Math.abs(trade.pnl_dollars || 0)}`}
              </div>
              <div style={{
                marginTop: 4, padding: '4px 12px', borderRadius: 20, display: 'inline-block',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                background: trade.status === 'open' ? 'rgba(245,158,11,0.15)'
                  : trade.win_loss === 'win' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: pnlColor,
              }}>
                {resultLabel}
              </div>
              {trade.actual_rr && (
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>R:R {trade.actual_rr.toFixed(2)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Price grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            ['Entry', trade.entry_price],
            ['Stop Loss', trade.stop_loss],
            ['Take Profit', trade.take_profit],
            ['Exit Price', trade.exit_price || '—'],
            ['Date', new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
            ['Timeframe', trade.timeframe],
            ...(trade.exit_date ? [['Duration', calcDuration(trade.date, trade.exit_date) || '—']] : []),
            ...(trade.exit_date ? [['Close', new Date(trade.exit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + new Date(trade.exit_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })]] : []),
          ].map(([label, val]) => (
            <div key={label} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {trade.pre_notes && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, marginBottom: 8 }}>PRE-TRADE NOTES</div>
            <pre style={{ fontSize: 13.5, color: C.text, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, margin: 0 }}>
              {trade.pre_notes}
            </pre>
          </div>
        )}
        {trade.post_notes && (
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: C.dim, fontWeight: 600, marginBottom: 8 }}>POST-TRADE NOTES</div>
            <pre style={{ fontSize: 13.5, color: C.text, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6, margin: 0 }}>
              {trade.post_notes}
            </pre>
          </div>
        )}

        {/* Post mortem panel */}
        {pmState.status !== 'idle' && (
          <div style={{
            background: C.card, border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 12 }}>✦ AI Post-Mortem</div>
            {pmState.status === 'loading' && <PMSkeleton />}
            {pmState.status === 'error' && (
              <div style={{ color: C.red, fontSize: 13 }}>Error: {pmState.error}</div>
            )}
            {pmState.status === 'done' && <PMContent pm={pmState.data} />}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Checklist display */}
        {trade.checklist_score !== undefined && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 10 }}>CHECKLIST</div>
            {checklist.map((q, i) => (
              <div key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}>
                  {i < trade.checklist_score ? '✓' : '○'}
                </span>
                <span style={{ fontSize: 12, color: i < trade.checklist_score ? C.text : C.dim, lineHeight: 1.4 }}>
                  {q.text}
                </span>
              </div>
            ))}
            <div style={{
              marginTop: 10, textAlign: 'center', padding: '5px 0', borderRadius: 8,
              background: trade.checklist_result === 'go' ? 'rgba(34,197,94,0.15)'
                : trade.checklist_result === 'caution' ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)',
              color: trade.checklist_result === 'go' ? C.green
                : trade.checklist_result === 'caution' ? C.yellow : C.red,
              fontWeight: 700, fontSize: 12,
            }}>
              {(trade.checklist_result || 'no_trade').toUpperCase().replace('_', ' ')}
              {' '}({trade.checklist_score}/7)
            </div>
          </div>
        )}

        {/* Ratings */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>CONFIDENCE</div>
            <ConfidenceDots value={trade.confidence || 0} color={C.blue} />
          </div>
          {trade.discipline !== null && trade.discipline !== undefined && (
            <div>
              <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>DISCIPLINE</div>
              <ConfidenceDots value={trade.discipline || 0} color={C.purple} />
            </div>
          )}
        </div>

        {/* BTC outlook */}
        {trade.btc_outlook && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 4 }}>BTC OUTLOOK</div>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
              background: trade.btc_outlook === 'Bullish' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: trade.btc_outlook === 'Bullish' ? C.green : C.red,
            }}>
              {trade.btc_outlook}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Journal list ─────────────────────────────────────────────────────────────
export default function Journal({ trades, tags, learnings, onSelectTrade, selectedTrade, onEdit }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState(-1); // -1=desc

  const filtered = useMemo(() => {
    let t = [...trades];
    if (search) {
      const q = search.toLowerCase();
      t = t.filter(tr =>
        tr.pair.toLowerCase().includes(q) ||
        (tr.pre_notes || '').toLowerCase().includes(q) ||
        (tr.post_notes || '').toLowerCase().includes(q) ||
        (tr.tags || []).some(tag => tag.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'all') t = t.filter(tr => tr.trade_type === typeFilter);
    if (resultFilter === 'wins') t = t.filter(tr => tr.win_loss === 'win');
    else if (resultFilter === 'losses') t = t.filter(tr => tr.win_loss === 'loss');
    else if (resultFilter === 'open') t = t.filter(tr => tr.status === 'open');
    t.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === 'date') { av = new Date(av); bv = new Date(bv); }
      if (av < bv) return -sortDir;
      if (av > bv) return sortDir;
      return 0;
    });
    return t;
  }, [trades, search, typeFilter, resultFilter, sortKey, sortDir]);

  if (selectedTrade) {
    return (
      <div style={{ padding: '0 24px' }}>
        <TradeDetail
          trade={selectedTrade}
          tags={tags}
          learnings={learnings}
          onBack={() => onSelectTrade(null)}
          onEdit={() => onEdit(selectedTrade)}
        />
      </div>
    );
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  const thStyle = (key) => ({
    padding: '8px 12px', textAlign: 'left', fontSize: 11.5, fontWeight: 600,
    color: sortKey === key ? C.blue : C.dim, cursor: 'pointer',
    borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
    background: C.card,
  });

  const tdStyle = {
    padding: '10px 12px', fontSize: 13.5, borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle',
  };

  return (
    <div style={{ padding: '0 24px 32px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search trades…"
          style={{ ...inp, width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterPill label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} />
          <FilterPill label="Real" active={typeFilter === 'real'} onClick={() => setTypeFilter('real')} />
          <FilterPill label="Paper" active={typeFilter === 'paper'} onClick={() => setTypeFilter('paper')} />
          <span style={{ width: 1, background: C.border2, margin: '0 4px' }} />
          <FilterPill label="Wins" active={resultFilter === 'wins'} onClick={() => setResultFilter(resultFilter === 'wins' ? 'all' : 'wins')} />
          <FilterPill label="Losses" active={resultFilter === 'losses'} onClick={() => setResultFilter(resultFilter === 'losses' ? 'all' : 'losses')} />
          <FilterPill label="Open" active={resultFilter === 'open'} onClick={() => setResultFilter(resultFilter === 'open' ? 'all' : 'open')} />
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: C.dim }}>{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${C.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: C.card }}>
          <thead>
            <tr>
              {[
                ['date', 'Date'], ['pair', 'Pair'], ['direction', 'Dir'], ['timeframe', 'TF'],
                ['entry_price', 'Entry'], ['actual_rr', 'R:R'], ['pnl_dollars', 'P&L'],
                ['confidence', 'Conf'], ['discipline', 'Disc'], ['win_loss', 'Result'], ['tags', 'Tags'],
              ].map(([key, label]) => (
                <th key={key} style={thStyle(key)} onClick={() => handleSort(key)}>
                  {label}{sortKey === key ? (sortDir === -1 ? ' ↓' : ' ↑') : ''}
                </th>
              ))}
              <th style={{ ...thStyle(''), cursor: 'default' }}>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} style={{ ...tdStyle, textAlign: 'center', color: C.dim, padding: 32 }}>
                  No trades found.
                </td>
              </tr>
            )}
            {filtered.map(t => {
              const pnlColor = t.status === 'open' ? C.yellow : (t.pnl_dollars || 0) >= 0 ? C.green : C.red;
              return (
                <tr key={t.id} style={{ cursor: 'pointer' }}
                  onClick={() => onSelectTrade(t)}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e2130'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={tdStyle}>
                    <span style={{ fontSize: 12.5, color: C.muted }}>
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: C.text }}>{t.pair}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                      background: t.direction === 'long' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: t.direction === 'long' ? C.green : C.red,
                    }}>
                      {t.direction.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: C.muted, fontSize: 12.5 }}>{t.timeframe}</td>
                  <td style={{ ...tdStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: C.text }}>{t.entry_price}</td>
                  <td style={{ ...tdStyle, fontSize: 13, color: (t.actual_rr || 0) >= 2 ? C.green : C.muted }}>
                    {t.actual_rr ? `${t.actual_rr.toFixed(2)}R` : '—'}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: pnlColor }}>
                    {t.status === 'open' ? '—' : `${(t.pnl_dollars || 0) >= 0 ? '+' : ''}$${Math.abs(t.pnl_dollars || 0)}`}
                  </td>
                  <td style={tdStyle}><ConfidenceDots value={t.confidence || 0} color={C.blue} /></td>
                  <td style={tdStyle}>
                    {t.discipline !== null && t.discipline !== undefined
                      ? <ConfidenceDots value={t.discipline || 0} color={C.purple} />
                      : <span style={{ color: C.dim, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={tdStyle}>
                    {t.status === 'open' ? (
                      <span style={{ fontSize: 11.5, color: C.yellow, fontWeight: 600 }}>OPEN</span>
                    ) : (
                      <span style={{
                        fontSize: 11.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                        background: t.win_loss === 'win' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: t.win_loss === 'win' ? C.green : C.red,
                      }}>
                        {(t.win_loss || '').toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 180 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(t.tags || []).slice(0, 2).map(tag => <TagBadge key={tag} name={tag} tags={tags} />)}
                      {(t.tags || []).length > 2 && (
                        <span style={{ fontSize: 11, color: C.dim }}>+{t.tags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td style={tdStyle} onClick={e => { e.stopPropagation(); onEdit(t); }}>
                    <button style={{
                      background: 'none', border: `1px solid ${C.border2}`, color: C.muted,
                      borderRadius: 5, padding: '3px 8px', fontSize: 12, cursor: 'pointer',
                    }}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
