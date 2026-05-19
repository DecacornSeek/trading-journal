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

const TAG_COLOR_PRESETS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981',
  '#ef4444', '#f97316', '#a855f7', '#22c55e', '#ec4899',
];

function Label({ children }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 5 }}>{children}</label>;
}

function Section({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 14px' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, letterSpacing: '0.08em' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

export default function Settings({ settings, onSave, tags, onAddTag, onDeleteTag }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [newTag, setNewTag] = useState({ name: '', color: TAG_COLOR_PRESETS[0] });
  const [showKey, setShowKey] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleAddTag = () => {
    if (!newTag.name.trim()) return;
    onAddTag({ id: Date.now(), name: newTag.name.trim(), color: newTag.color });
    setNewTag({ name: '', color: TAG_COLOR_PRESETS[0] });
  };

  return (
    <div style={{ padding: '0 24px 48px', maxWidth: 640 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 28 }}>
        <Section title="PORTFOLIO" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 4 }}>
          <div>
            <Label>Portfolio Size ($)</Label>
            <input type="number" value={form.portfolioSize} onChange={e => set('portfolioSize', e.target.value)} style={inp} />
          </div>
          <div>
            <Label>Default Risk %</Label>
            <input type="number" step="0.1" min="0.1" max="10" value={form.defaultRiskPct}
              onChange={e => set('defaultRiskPct', e.target.value)} style={inp} />
          </div>
        </div>

        <Section title="AI INTEGRATION" />
        {/* AI Mode toggle */}
        <div style={{ marginBottom: 18 }}>
          <Label>AI Mode</Label>
          <div style={{ display: 'flex', gap: 0, borderRadius: 9, overflow: 'hidden', border: `1px solid ${C.border2}`, width: 'fit-content' }}>
            {[
              { value: 'claudecom', label: '✦  Claude.com', sub: 'Use your subscription' },
              { value: 'api', label: '⚡  Anthropic API', sub: 'Pay-per-use key' },
            ].map(opt => {
              const active = (form.aiMode || 'claudecom') === opt.value;
              return (
                <button key={opt.value} onClick={() => set('aiMode', opt.value)} style={{
                  padding: '10px 20px', background: active ? '#7c3aed' : 'transparent',
                  color: active ? '#fff' : C.muted, border: 'none', cursor: 'pointer',
                  fontWeight: active ? 600 : 400, fontSize: 13.5, transition: 'all 0.15s',
                  minWidth: 160,
                }}>
                  <div>{opt.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{opt.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Claude.com mode info */}
        {(form.aiMode || 'claudecom') === 'claudecom' && (
          <div style={{
            marginBottom: 14, padding: '14px 16px', borderRadius: 10,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
          }}>
            <div style={{ fontWeight: 600, color: '#c4b5fd', fontSize: 13, marginBottom: 6 }}>
              ✦ Using your Claude.com subscription
            </div>
            <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
              The AI Coach will format your full trading context and open Claude.com in a new tab.
              Just paste with <kbd style={{ background: '#1e2130', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>Ctrl+V</kbd> and chat.
            </div>
            <div style={{ marginTop: 10 }}>
              <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, color: '#a78bfa', textDecoration: 'none', fontWeight: 500,
              }}>
                Open Claude.com →
              </a>
            </div>
          </div>
        )}

        {/* API key — only shown in api mode */}
        {(form.aiMode || 'claudecom') === 'api' && (
          <div style={{ marginBottom: 14 }}>
            <Label>Anthropic API Key</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={form.anthropicApiKey || ''}
                onChange={e => set('anthropicApiKey', e.target.value)}
                placeholder="sk-ant-api03-…"
                style={{ ...inp, flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}
                autoComplete="off"
              />
              <button onClick={() => setShowKey(s => !s)} style={{
                background: '#1e2130', border: `1px solid ${C.border2}`, color: C.muted,
                borderRadius: 7, padding: '0 12px', fontSize: 13, cursor: 'pointer', flexShrink: 0,
              }}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>
              Used for AI Coach and Post-Mortem. Stored locally in your browser only.
              Get your key at{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                style={{ color: C.blue }}>
                console.anthropic.com
              </a>
            </div>
          </div>
        )}

        <Section title="TAGS" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {tags.map(tag => (
            <div key={tag.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', background: '#0f1117', borderRadius: 8,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5, color: C.text }}>{tag.name}</span>
              <button onClick={() => onDeleteTag(tag.id)} style={{
                background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 15,
              }}>✕</button>
            </div>
          ))}
        </div>
        {/* Add tag */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={newTag.name} onChange={e => setNewTag(n => ({ ...n, name: e.target.value }))}
            placeholder="New tag name…" style={{ ...inp, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 160 }}>
            {TAG_COLOR_PRESETS.map(color => (
              <button key={color} onClick={() => setNewTag(n => ({ ...n, color }))} style={{
                width: 18, height: 18, borderRadius: '50%', background: color, border: 'none',
                cursor: 'pointer', outline: newTag.color === color ? `2px solid #fff` : 'none',
                outlineOffset: 1,
              }} />
            ))}
          </div>
          <button onClick={handleAddTag} style={{
            background: C.blue, color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Add
          </button>
        </div>

        <Section title="DATA" />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => {
            const data = {
              trades: JSON.parse(localStorage.getItem('tradelog_trades') || '[]'),
              learnings: JSON.parse(localStorage.getItem('tradelog_learnings') || '[]'),
              tags: JSON.parse(localStorage.getItem('tradelog_tags') || '[]'),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `tradelog-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
          }} style={{
            background: '#1e2130', border: `1px solid ${C.border2}`, color: C.text,
            borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
          }}>
            ↓ Export JSON
          </button>
        </div>

        {/* Save */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} style={{
            background: saved ? C.green : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff', border: 'none', borderRadius: 9,
            padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.3s',
          }}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
