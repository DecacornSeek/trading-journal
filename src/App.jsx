import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Journal from './components/Journal'
import NewTrade from './components/NewTrade'
import Coach from './components/Coach'
import Learnings from './components/Learnings'
import Settings from './components/Settings'
import { Calculator, FloatingCalc } from './components/Calculator'
import { SAMPLE_TRADES, SAMPLE_LEARNINGS, INITIAL_TAGS, INITIAL_SETTINGS } from './data/sampleData'

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

const PAGE_LABELS = {
  dashboard: 'Dashboard',
  journal: 'Trade Journal',
  coach: 'AI Coach',
  'new-trade': 'Log Trade',
  calculator: 'Position Calculator',
  learnings: 'My Learnings',
  settings: 'Settings',
}

export default function App() {
  const [page, setPage] = useState(() => sessionStorage.getItem('tradelog_page') || 'dashboard')
  const [trades, setTrades] = useState(() => loadLS('tradelog_trades', SAMPLE_TRADES))
  const [learnings, setLearnings] = useState(() => loadLS('tradelog_learnings', SAMPLE_LEARNINGS))
  const [tags, setTags] = useState(() => loadLS('tradelog_tags', INITIAL_TAGS))
  const [settings, setSettings] = useState(() => loadLS('tradelog_settings', INITIAL_SETTINGS))
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editTrade, setEditTrade] = useState(null)

  useEffect(() => { localStorage.setItem('tradelog_trades', JSON.stringify(trades)) }, [trades])
  useEffect(() => { localStorage.setItem('tradelog_learnings', JSON.stringify(learnings)) }, [learnings])
  useEffect(() => { localStorage.setItem('tradelog_tags', JSON.stringify(tags)) }, [tags])
  useEffect(() => { localStorage.setItem('tradelog_settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { sessionStorage.setItem('tradelog_page', page) }, [page])

  const navigateTo = useCallback((p) => {
    setSelectedTrade(null)
    if (p !== 'new-trade') setEditTrade(null)
    setPage(p)
  }, [])

  const handleSaveTrade = useCallback((trade) => {
    setTrades(prev => {
      const idx = prev.findIndex(t => t.id === trade.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = trade; return next; }
      return [trade, ...prev]
    })
    setEditTrade(null)
    navigateTo('journal')
  }, [navigateTo])

  const handleEditTrade = useCallback((trade) => {
    setEditTrade(trade)
    setPage('new-trade')
  }, [])

  const handleSaveSettings = useCallback((s) => {
    setSettings(s)
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const isJournalDetail = page === 'journal' && selectedTrade !== null

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar page={page} navigateTo={navigateTo} trades={trades} />

      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 56, borderBottom: '1px solid #1e2130', background: '#0f1117',
          display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
          flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
        }}>
          {isJournalDetail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9ca3af' }}>
              <span style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => setSelectedTrade(null)}>Journal</span>
              <span>/</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{selectedTrade.pair}</span>
            </div>
          ) : (
            <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 16 }}>
              {PAGE_LABELS[page] || page}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#6b7280' }}>{today}</span>
          <button onClick={() => navigateTo('new-trade')} style={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            + Log Trade
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24 }}>
          {page === 'dashboard' && (
            <Dashboard trades={trades} navigateTo={navigateTo} />
          )}
          {page === 'journal' && (
            <Journal
              trades={trades} tags={tags} learnings={learnings}
              onSelectTrade={setSelectedTrade} selectedTrade={selectedTrade}
              onEdit={handleEditTrade}
            />
          )}
          {page === 'new-trade' && (
            <NewTrade tags={tags} editTrade={editTrade} onSave={handleSaveTrade} />
          )}
          {page === 'coach' && (
            <Coach trades={trades} learnings={learnings} />
          )}
          {page === 'calculator' && (
            <Calculator navigateTo={navigateTo} />
          )}
          {page === 'learnings' && (
            <Learnings
              learnings={learnings}
              onAdd={(l) => setLearnings(prev => [l, ...prev])}
              onDelete={(id) => setLearnings(prev => prev.filter(l => l.id !== id))}
            />
          )}
          {page === 'settings' && (
            <Settings
              settings={settings} onSave={handleSaveSettings}
              tags={tags}
              onAddTag={(tag) => setTags(prev => [...prev, tag])}
              onDeleteTag={(id) => setTags(prev => prev.filter(t => t.id !== id))}
            />
          )}
        </div>
      </div>

      {page !== 'calculator' && <FloatingCalc />}
    </div>
  )
}
