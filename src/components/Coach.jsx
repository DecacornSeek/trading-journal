import { useState, useRef, useMemo, useCallback } from 'react';
import { callClaude } from '../lib/claude';

const C = {
  card: '#1a1d27', border: '#1e2130', border2: '#2a2e39',
  green: '#22c55e', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6',
  purple: '#a78bfa', text: '#e2e8f0', muted: '#9ca3af', dim: '#6b7280',
};

const QUICK_PROMPTS = [
  'Analyse my recent losing streak',
  'What patterns do you see in my best trades?',
  'How can I improve my discipline score?',
  'Am I trading my system consistently?',
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '10px 14px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: C.purple,
          animation: `coachDot 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

// Minimal markdown renderer
function MdText({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text }}>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <div key={i} style={{ fontWeight: 700, color: C.text, marginTop: 10, marginBottom: 4, fontSize: 14 }}>{line.slice(3)}</div>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          const content = line.slice(2);
          return <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span style={{ color: C.purple, flexShrink: 0 }}>•</span>
            <span>{renderInline(content)}</span>
          </div>;
        }
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
        return <div key={i} style={{ marginBottom: 2 }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: C.text }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: '#2a2e39', padding: '1px 5px', borderRadius: 4, fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace" }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 10, marginTop: 2,
          background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
        }}>
          ✦
        </div>
      )}
      <div style={{
        maxWidth: '80%', padding: '10px 14px', borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        background: isUser ? C.blue : C.card,
        border: isUser ? 'none' : `1px solid ${C.border}`,
        color: C.text,
      }}>
        {isUser ? (
          <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{msg.content}</span>
        ) : (
          <MdText text={msg.content} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed22, #a78bfa22)',
        border: '1px solid rgba(167,139,250,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 14,
      }}>
        ✦
      </div>
      <div style={{ fontWeight: 700, color: C.text, marginBottom: 8, fontSize: 16 }}>AI Trading Coach</div>
      <div style={{ fontSize: 13.5, color: C.muted, textAlign: 'center', maxWidth: 300, lineHeight: 1.6, marginBottom: 20 }}>
        Ask me anything about your trades, patterns, or the NCI method. I have full context of your journal.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 300 }}>
        {QUICK_PROMPTS.map((q, i) => (
          <button key={i} onClick={() => onPrompt(q)} style={{
            background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
            color: C.purple, borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer',
            textAlign: 'left', fontWeight: 500,
          }}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Coach ────────────────────────────────────────────────────────────────────
export default function Coach({ trades, learnings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const systemPrimer = useMemo(() => {
    const tradeJson = JSON.stringify(trades, null, 2);
    const lessonJson = JSON.stringify(learnings, null, 2);
    return `You are a professional trading coach specialised in the NCI (No Cap Intelligence) ICT-based trading system.

TRADER'S FULL JOURNAL DATA:
Trades: ${tradeJson}

Learnings: ${lessonJson}

COACHING RULES:
1. Be specific and data-driven. Reference actual trades by pair and date.
2. Don't give generic advice — tie every insight to the trader's real data.
3. Use NCI terminology: HTF bias, PD arrays, liquidity sweeps, BOS, FVG, OB, displacement.
4. Be direct but encouraging. Point out patterns both good and bad.
5. If you see revenge trading or emotional trades, flag them clearly.
6. Always suggest one concrete rule or process improvement at the end.
7. Keep responses concise — use bullet points for analysis.`;
  }, [trades, learnings]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 50);
  };

  const send = useCallback(async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    scrollToBottom();

    try {
      // Prepend system primer to first user message
      const apiMessages = newMessages.map((m, i) => {
        if (m.role === 'user' && i === 0) {
          return { role: 'user', content: `${systemPrimer}\n\n---\n\n${m.content}` };
        }
        return m;
      });

      const reply = await callClaude({ messages: apiMessages });
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error:** ${e.message}\n\nPlease add your Anthropic API key in Settings → AI Coach.`,
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [messages, input, systemPrimer]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ padding: '0 24px', display: 'flex', gap: 20, height: 'calc(100vh - 112px)' }}>
      {/* Chat */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#0f1117', border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {messages.length === 0
            ? <EmptyState onPrompt={send} />
            : messages.map((m, i) => <Message key={i} msg={m} />)
          }
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff',
              }}>✦</div>
              <TypingDots />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your coach… (Enter to send, Shift+Enter for newline)"
            rows={2}
            style={{
              flex: 1, background: '#131722', border: `1px solid ${C.border2}`,
              borderRadius: 9, color: C.text, padding: '8px 12px', fontSize: 13.5,
              resize: 'none', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            background: input.trim() && !loading ? C.purple : '#2a2e39',
            border: 'none', borderRadius: 9, padding: '0 18px',
            color: '#fff', fontSize: 18, cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}>
            ↑
          </button>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 12, fontSize: 13 }}>Quick Prompts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => send(q)} style={{
                background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
                color: C.purple, borderRadius: 7, padding: '8px 10px', fontSize: 12.5,
                cursor: 'pointer', textAlign: 'left', lineHeight: 1.4,
              }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 600, color: C.text, marginBottom: 10, fontSize: 13 }}>How it works</div>
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
            Your full trade journal and learnings are sent to Claude with every message.
            The coach analyses patterns and gives NCI-specific feedback.
          </div>
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 7, background: '#0f1117', fontSize: 12, color: C.dim }}>
            {trades.length} trades · {learnings.length} lessons loaded
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={() => setMessages([])} style={{
            background: 'transparent', border: `1px solid ${C.border2}`, color: C.dim,
            borderRadius: 8, padding: '7px 0', fontSize: 12.5, cursor: 'pointer',
          }}>
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}
