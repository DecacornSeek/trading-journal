import { useState, useMemo } from 'react';

const C = {
  card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  purple: '#a78bfa', text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

const inp = {
  background: '#0f1117', border: `1px solid ${C.border2}`, borderRadius: 7,
  color: C.text, padding: '8px 12px', fontSize: 13.5, outline: 'none',
  fontFamily: 'inherit', width: '100%',
};

const CAT_COLORS = {
  'Key Lessons': C.green,
  'Entry Model': C.blue,
  'Stop Loss': C.red,
  'Session Patterns': C.yellow,
  'Psychology': C.purple,
};

const CATEGORIES = Object.keys(CAT_COLORS);

function FilterPill({ label, active, onClick }) {
  const color = CAT_COLORS[label] || C.blue;
  return (
    <button onClick={onClick} style={{
      background: active ? `${color}20` : 'transparent',
      border: active ? `1px solid ${color}88` : `1px solid ${C.border2}`,
      color: active ? color : C.muted,
      borderRadius: 20, padding: '4px 14px', fontSize: 12.5, cursor: 'pointer',
      fontWeight: active ? 600 : 400,
    }}>
      {label}
    </button>
  );
}

export default function Learnings({ learnings, onAdd, onDelete }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], description: '' });
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    let l = [...learnings];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    if (catFilter !== 'all') l = l.filter(item => item.category === catFilter);
    return l.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [learnings, search, catFilter]);

  const handleAdd = () => {
    if (!form.title.trim()) return;
    onAdd({
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      ...form,
    });
    setForm({ title: '', category: CATEGORIES[0], description: '' });
    setShowForm(false);
  };

  return (
    <div style={{ padding: '0 24px 32px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search learnings…" style={{ ...inp, width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterPill label="all" active={catFilter === 'all'} onClick={() => setCatFilter('all')} />
          {CATEGORIES.map(cat => (
            <FilterPill key={cat} label={cat} active={catFilter === cat} onClick={() => setCatFilter(cat)} />
          ))}
        </div>
        <button onClick={() => setShowForm(f => !f)} style={{
          marginLeft: 'auto', background: C.blue, color: '#fff', border: 'none',
          borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          + Add Learning
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 14 }}>New Learning</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 5 }}>Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Key insight title…" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 5 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 5 }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              placeholder="Describe the lesson in detail…" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleAdd} style={{
              background: C.green, color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Save Learning
            </button>
            <button onClick={() => setShowForm(false)} style={{
              background: 'transparent', border: `1px solid ${C.border2}`, color: C.muted,
              borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: C.dim, padding: 48, fontSize: 14 }}>
          No learnings found.
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(item => {
          const color = CAT_COLORS[item.category] || C.blue;
          return (
            <div key={item.id} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              padding: 18, display: 'flex', flexDirection: 'column', gap: 10,
              borderTop: `3px solid ${color}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 10,
                  background: `${color}18`, color,
                }}>
                  {item.category}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: C.dim, whiteSpace: 'nowrap' }}>
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </span>
                  <button onClick={() => onDelete(item.id)} style={{
                    background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                    fontSize: 15, padding: '0 2px', lineHeight: 1,
                  }} title="Delete">
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 14, lineHeight: 1.4 }}>{item.title}</div>
              {item.description && (
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.description}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
