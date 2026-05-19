// Anthropic API helper — uses key from settings stored in localStorage
// Call claude(prompt) for a one-shot string completion
// Call claude({ messages }) for a multi-turn conversation

export async function callClaude(input) {
  const settings = JSON.parse(localStorage.getItem('tradelog_settings') || '{}');
  const apiKey = settings.anthropicApiKey || '';

  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Add it in Settings → AI Coach.');
  }

  let messages;
  if (typeof input === 'string') {
    messages = [{ role: 'user', content: input }];
  } else if (input && input.messages) {
    messages = input.messages;
  } else {
    throw new Error('Invalid input to callClaude');
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${resp.status}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text ?? '';
}
