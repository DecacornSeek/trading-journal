export function getTradeCurrency(trade) {
  return trade.pnl_currency || 'USD';
}

export function formatPnlValue(value, currency = 'USD', decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '';
  const suffix = symbol ? '' : ` ${currency}`;
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${symbol}${Math.abs(value).toFixed(decimals)}${suffix}`;
}

export function groupPnlByCurrency(trades) {
  return trades.reduce((totals, trade) => {
    if (!Number.isFinite(trade.pnl_dollars)) return totals;
    const currency = getTradeCurrency(trade);
    totals[currency] = (totals[currency] || 0) + trade.pnl_dollars;
    return totals;
  }, {});
}

export function formatPnlGroups(groups, decimals = 2, fallbackCurrency = 'USD') {
  const entries = Object.entries(groups).sort(([a], [b]) => {
    const order = { USD: 0, EUR: 1 };
    return (order[a] ?? 99) - (order[b] ?? 99) || a.localeCompare(b);
  });
  if (!entries.length) return formatPnlValue(0, fallbackCurrency, decimals);
  return entries.map(([currency, value]) => formatPnlValue(value, currency, decimals)).join(' · ');
}

export function formatTradePnl(trade, decimals = 2) {
  return formatPnlValue(trade.pnl_dollars, getTradeCurrency(trade), decimals);
}

export function pnlTone(groups) {
  const values = Object.values(groups);
  if (!values.length || values.every(value => value >= 0)) return 'positive';
  if (values.every(value => value < 0)) return 'negative';
  return 'mixed';
}