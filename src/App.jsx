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
import { JULY_2026_TRADES } from './data/july2026Trades'
import WORKBOOK_TRADES from './data/workbookTrades.json'
import EXCEL_LEARNINGS from './data/excelLearnings.json'
import { FRAMEWORK_LEARNINGS } from './data/frameworkLearnings'

const JULY_2026_MIGRATION_KEY = 'tradelog_migration_july_2026_v4'
const WORKBOOK_MIGRATION_KEY = 'tradelog_migration_excel_real_v1'
const DEMO_LEARNINGS_MIGRATION_KEY = 'tradelog_migration_remove_demo_learnings_v1'
const CURATED_LEARNINGS_MIGRATION_KEY = 'tradelog_migration_curated_learnings_v1'

function loadLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

function loadTrades() {
  const existing = loadLS('tradelog_trades', [])
  const julyMigrated = localStorage.getItem(JULY_2026_MIGRATION_KEY)
  const workbookMigrated = localStorage.getItem(WORKBOOK_MIGRATION_KEY)
  if (julyMigrated && workbookMigrated) return existing

  const preserved = existing.filter(trade => (
    !SAMPLE_TRADES.some(sample => (
      sample.id === trade.id && sample.date === trade.date && sample.pair === trade.pair
    ))
  ))
  const existingIds = new Set(preserved.map(trade => trade.id))
  const additions = [
    ...(!julyMigrated ? JULY_2026_TRADES : []),
    ...(!workbookMigrated ? WORKBOOK_TRADES : []),
  ].filter(trade => !existingIds.has(trade.id))
  const merged = [...additions, ...preserved].sort((a, b) => new Date(b.date) - new Date(a.date))
  localStorage.setItem('tradelog_trades', JSON.stringify(merged))
  if (!julyMigrated) localStorage.setItem(JULY_2026_MIGRATION_KEY, new Date().toISOString())
  if (!workbookMigrated) localStorage.setItem(WORKBOOK_MIGRATION_KEY, new Date().toISOString())
  return merged
}

function loadLearnings() {
  const existing = loadLS('tradelog_learnings', [])
  const demoCleaned = localStorage.getItem(DEMO_LEARNINGS_MIGRATION_KEY)
  const curatedMigrated = localStorage.getItem(CURATED_LEARNINGS_MIGRATION_KEY)
  if (demoCleaned && curatedMigrated) return existing

  const cleaned = demoCleaned ? existing : existing.filter(learning => !SAMPLE_LEARNINGS.some(sample => (
    sample.id === learning.id && sample.date === learning.date && sample.title === learning.title
  )))
  const existingIds = new Set(cleaned.map(learning => learning.id))
  const additions = curatedMigrated ? [] : [...EXCEL_LEARNINGS, ...FRAMEWORK_LEARNINGS]
    .filter(learning => !existingIds.has(learning.id))
  const merged = [...additions, ...cleaned]
  localStorage.setItem('tradelog_learnings', JSON.stringify(merged))
  if (!demoCleaned) localStorage.setItem(DEMO_LEARNINGS_MIGRATION_KEY, new Date().toISOString())
  if (!curatedMigrated) localStorage.setItem(CURATED_LEARNINGS_MIGRATION_KEY, new Date().toISOString())
  return merged
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
  const [trades, setTrades] = useState(loadTrades)
  const [learnings, setLearnings] = useState(loadLearnings)
  const [tags, setTags] = useState(() => loadLS('tradelog_tags', INITIAL_TAGS))
  const [settings, setSettings] = useState(() => ({
    ...INITIAL_SETTINGS,
    ...loadLS('tradelog_settings', {}),
  }))
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [editTrade, setEditTrade] = useState(null)

  useEffect(() => { localStorage.setItem('tradelog_trades', JSON.stringify(trades)) }, [trades])
  useEffect(() => { localStorage.setItem('tradelog_learnings', JSON.stringify(learnings)) }, [learnings])
  useEffect(() => { localStorage.setItem('tradelog_tags', JSON.stringify(tags)) }, [tags])
  useEffect(() => { localStorage.setItem('tradelog_settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { sessionStorage.setItem('tradelog_page', page) }, [page])

  const navigateTo = useCallback((p) => {
    setSelectedTrade(null)
    setEditTrade(null)
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
            <NewTrade key={editTrade?.id || 'new'} tags={tags} editTrade={editTrade} settings={settings} onSave={handleSaveTrade} />
          )}
          {page === 'coach' && (
            <Coach trades={trades} learnings={learnings} settings={settings} />
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
