import workbookTrades from '../src/data/workbookTrades.json' with { type: 'json' };
import { JULY_2026_TRADES } from '../src/data/july2026Trades.js';

function reviewedReal(trade) {
  return trade.trade_type === 'real' && trade.status === 'closed';
}

function sumPnl(trades) {
  return Number(trades.reduce((sum, trade) => (
    sum + (Number.isFinite(trade.pnl_dollars) ? trade.pnl_dollars : 0)
  ), 0).toFixed(2));
}

function wilsonInterval(successes, trials, z = 1.96) {
  if (!trials) return [null, null];
  const proportion = successes / trials;
  const denominator = 1 + ((z ** 2) / trials);
  const center = (proportion + ((z ** 2) / (2 * trials))) / denominator;
  const margin = (z * Math.sqrt(
    (proportion * (1 - proportion) / trials) + ((z ** 2) / (4 * trials ** 2)),
  )) / denominator;
  return [Number(((center - margin) * 100).toFixed(1)), Number(((center + margin) * 100).toFixed(1))];
}

function longestLossStreak(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let current = 0;
  let longest = 0;
  for (const trade of sorted) {
    current = trade.win_loss === 'loss' ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

function sampleMeanInterval(trades, z = 1.96) {
  const values = trades.map(trade => trade.pnl_dollars).filter(Number.isFinite);
  if (values.length < 2) return [null, null];
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
  const margin = z * Math.sqrt(variance / values.length);
  return [Number((mean - margin).toFixed(2)), Number((mean + margin).toFixed(2))];
}

function sequentialDrawdown(trades) {
  const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
  let cumulative = 0;
  let peak = 0;
  let maximumDrawdown = 0;
  let maximumDrawdownDate = null;
  for (const trade of sorted) {
    if (!Number.isFinite(trade.pnl_dollars)) continue;
    cumulative += trade.pnl_dollars;
    peak = Math.max(peak, cumulative);
    const drawdown = peak - cumulative;
    if (drawdown > maximumDrawdown) {
      maximumDrawdown = drawdown;
      maximumDrawdownDate = trade.date;
    }
  }
  return {
    maximumDrawdown: Number(maximumDrawdown.toFixed(2)),
    maximumDrawdownDate,
    endingPnl: Number(cumulative.toFixed(2)),
  };
}

function groupDays(trades) {
  return Object.entries(trades.reduce((days, trade) => {
    const date = trade.date.slice(0, 10);
    days[date] = [...(days[date] || []), trade];
    return days;
  }, {})).map(([date, dayTrades]) => ({
    date,
    trades: dayTrades.length,
    wins: dayTrades.filter(trade => trade.win_loss === 'win').length,
    pnl: sumPnl(dayTrades),
  }));
}

function sourceStatistics(name, currency, sourceTrades) {
  const trades = sourceTrades.filter(reviewedReal);
  const knownPnl = trades.filter(trade => Number.isFinite(trade.pnl_dollars));
  const wins = trades.filter(trade => trade.win_loss === 'win');
  const losses = trades.filter(trade => trade.win_loss === 'loss');
  const knownWins = wins.filter(trade => Number.isFinite(trade.pnl_dollars));
  const knownLosses = losses.filter(trade => Number.isFinite(trade.pnl_dollars));
  const grossWins = sumPnl(knownWins);
  const grossLosses = Math.abs(sumPnl(knownLosses));
  const days = groupDays(knownPnl);
  const highFrequencyDays = days.filter(day => day.trades > 2);
  const lowerFrequencyDays = days.filter(day => day.trades <= 2);
  const byDirection = Object.fromEntries(['long', 'short'].map(direction => {
    const group = trades.filter(trade => trade.direction === direction);
    return [direction, {
      trades: group.length,
      wins: group.filter(trade => trade.win_loss === 'win').length,
      winRatePct: group.length
        ? Number((group.filter(trade => trade.win_loss === 'win').length / group.length * 100).toFixed(1))
        : null,
      pnl: sumPnl(group),
    }];
  }));
  const byMarket = Object.fromEntries(['btc', 'alts'].map(market => {
    const group = trades.filter(trade => market === 'btc'
      ? trade.pair.toUpperCase().includes('BTC')
      : !trade.pair.toUpperCase().includes('BTC'));
    return [market, {
      trades: group.length,
      wins: group.filter(trade => trade.win_loss === 'win').length,
      winRatePct: group.length
        ? Number((group.filter(trade => trade.win_loss === 'win').length / group.length * 100).toFixed(1))
        : null,
      pnl: sumPnl(group),
    }];
  }));

  return {
    name,
    currency,
    reviewedTrades: trades.length,
    knownPnlTrades: knownPnl.length,
    wins: wins.length,
    losses: losses.length,
    winRatePct: Number((wins.length / trades.length * 100).toFixed(1)),
    winRate95Pct: wilsonInterval(wins.length, trades.length),
    totalPnl: sumPnl(knownPnl),
    averagePnl: Number((sumPnl(knownPnl) / knownPnl.length).toFixed(2)),
    averageWin: knownWins.length ? Number((grossWins / knownWins.length).toFixed(2)) : null,
    averageLoss: knownLosses.length ? Number((-grossLosses / knownLosses.length).toFixed(2)) : null,
    profitFactor: grossLosses ? Number((grossWins / grossLosses).toFixed(2)) : null,
    expectancyPerKnownTrade: knownPnl.length
      ? Number(((grossWins - grossLosses) / knownPnl.length).toFixed(2))
      : null,
    expectancy95Approx: sampleMeanInterval(knownPnl),
    averageWinLossRatio: knownWins.length && knownLosses.length
      ? Number(((grossWins / knownWins.length) / (grossLosses / knownLosses.length)).toFixed(2))
      : null,
    breakEvenWinRatePct: grossWins && grossLosses
      ? Number((1 / (1 + ((grossWins / knownWins.length) / (grossLosses / knownLosses.length))) * 100).toFixed(1))
      : null,
    longestLossStreak: longestLossStreak(trades),
    sequentialDrawdown: sequentialDrawdown(knownPnl),
    stopKnown: trades.filter(trade => Number(trade.stop_loss) > 0).length,
    rrKnown: trades.filter(trade => Number.isFinite(trade.actual_rr)).length,
    days: days.length,
    averageTradesPerDay: Number((knownPnl.length / days.length).toFixed(2)),
    maximumTradesInDay: Math.max(...days.map(day => day.trades)),
    daysOverTwoTrades: highFrequencyDays.length,
    pnlDaysOverTwoTrades: sumPnl(highFrequencyDays.map(day => ({ pnl_dollars: day.pnl }))),
    pnlDaysAtMostTwoTrades: sumPnl(lowerFrequencyDays.map(day => ({ pnl_dollars: day.pnl }))),
    profitableDaysOverTwoTrades: highFrequencyDays.filter(day => day.pnl > 0).length,
    losingDaysOverTwoTrades: highFrequencyDays.filter(day => day.pnl < 0).length,
    worstDays: [...days].sort((a, b) => a.pnl - b.pnl).slice(0, 5),
    bestDays: [...days].sort((a, b) => b.pnl - a.pnl).slice(0, 5),
    byDirection,
    byMarket,
  };
}

const notePatterns = {
  revengeOrRecovery: /revenge|rache|wiederhaben|recover/i,
  workContext: /work|arbeit/i,
  weakRiskManagement: /risk management|risikomanagement|hebel|oversiz/i,
  outsideOpinion: /youtube|youtuber|outside opinion|trusted/i,
};

const reviewedWorkbook = workbookTrades.filter(reviewedReal);
const behaviorEvidence = Object.fromEntries(Object.entries(notePatterns).map(([name, pattern]) => [
  name,
  reviewedWorkbook.filter(trade => pattern.test(`${trade.pre_notes || ''} ${trade.post_notes || ''}`)).map(trade => ({
    id: trade.id,
    date: trade.date.slice(0, 10),
    pair: trade.pair,
    result: trade.win_loss,
    pnl: trade.pnl_dollars,
    excerpt: `${trade.pre_notes || ''} ${trade.post_notes || ''}`.replace(/\s+/g, ' ').trim().slice(0, 280),
  })),
]));

const result = {
  recentJulyUsd: sourceStatistics('July statement, accidental paper excluded', 'USD', JULY_2026_TRADES),
  historicalExcelEur: sourceStatistics('Excel Real Trading history', 'EUR', workbookTrades),
  behaviorEvidence,
  accidentalJulyIncident: (() => {
    const accidental = JULY_2026_TRADES.filter(trade => trade.trade_type === 'paper');
    const btcLiquidations = accidental.filter(trade => trade.pair === 'BTCUSD');
    return {
      positions: accidental.length,
      combinedNetPnlUsd: sumPnl(accidental),
      btcLiquidationNetPnlUsd: sumPnl(btcLiquidations),
      exceedsChallengeDailyLimit: Math.abs(sumPnl(btcLiquidations)) > 300,
      exceedsChallengeTotalDrawdown: Math.abs(sumPnl(accidental)) > 600,
      note: 'One user-confirmed accidental work-time/no-stop incident; positions are not independent observations.',
    };
  })(),
  limitations: {
    currenciesCannotBeCombined: true,
    challengeTradesRecorded: 0,
    julyStopKnown: JULY_2026_TRADES.filter(reviewedReal).filter(trade => Number(trade.stop_loss) > 0).length,
    excelStopKnown: workbookTrades.filter(reviewedReal).filter(trade => Number(trade.stop_loss) > 0).length,
    julyRrKnown: JULY_2026_TRADES.filter(reviewedReal).filter(trade => Number.isFinite(trade.actual_rr)).length,
    excelRrKnown: workbookTrades.filter(reviewedReal).filter(trade => Number.isFinite(trade.actual_rr)).length,
  },
};

console.log(JSON.stringify(result, null, 2));