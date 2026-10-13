export const CLASSIC_ONE_STEP_10K = Object.freeze({
  provider: 'Breakout',
  name: '$10K Classic 1-step',
  stage: 'Evaluation',
  startingBalance: 10000,
  profitTarget: 1000,
  targetBalance: 11000,
  maxDailyLoss: 300,
  maxDrawdown: 600,
  drawdownFloor: 9400,
  drawdownType: 'Static',
  dailyResetUtc: '00:30',
  minimumTradingDays: 0,
  timeLimit: 'None',
  consistencyRule: 'None',
  btcEthMaxLeverage: 5,
  altcoinMaxLeverage: 2,
  commissionPerSidePct: 0.04,
  roundTripCommissionPct: 0.08,
  overnightSwapPct: 0.09,
  overnightSwapTimeUtc: '00:00',
  weekendTradingAllowed: true,
  newsTradingAllowed: true,
  prohibited: ['Copy trading', 'Latency or price arbitrage', 'Exploiting pricing errors', 'Account sharing'],
});

export const DEFAULT_CHALLENGE_SETTINGS = Object.freeze({
  challengeEnabled: true,
  challengeCurrentBalance: '10000',
  challengeCurrentEquity: '10000',
  challengeDayStartBalance: '10000',
  challengeRiskPerTrade: '50',
  challengePersonalDailyStop: '100',
  challengeMaxTradesPerDay: '2',
  challengeTradesToday: '0',
});

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizeChallengeSettings(settings = {}) {
  const merged = { ...DEFAULT_CHALLENGE_SETTINGS, ...settings };
  return {
    enabled: merged.challengeEnabled !== false,
    currentBalance: finiteNumber(merged.challengeCurrentBalance, CLASSIC_ONE_STEP_10K.startingBalance),
    currentEquity: finiteNumber(merged.challengeCurrentEquity, CLASSIC_ONE_STEP_10K.startingBalance),
    dayStartBalance: finiteNumber(merged.challengeDayStartBalance, CLASSIC_ONE_STEP_10K.startingBalance),
    riskPerTrade: Math.max(0, finiteNumber(merged.challengeRiskPerTrade, 50)),
    personalDailyStop: Math.max(0, finiteNumber(merged.challengePersonalDailyStop, 100)),
    maxTradesPerDay: Math.max(1, Math.floor(finiteNumber(merged.challengeMaxTradesPerDay, 2))),
    tradesToday: Math.max(0, Math.floor(finiteNumber(merged.challengeTradesToday, 0))),
  };
}

export function getChallengeMetrics(settings = {}) {
  const state = normalizeChallengeSettings(settings);
  const rules = CLASSIC_ONE_STEP_10K;
  const riskReference = Math.min(state.currentBalance, state.currentEquity);
  const drawdownUsed = Math.max(0, rules.startingBalance - riskReference);
  const drawdownRemaining = Math.max(0, riskReference - rules.drawdownFloor);
  const dailyLossUsed = Math.max(0, state.dayStartBalance - riskReference);
  const dailyLossRemaining = Math.max(0, rules.maxDailyLoss - dailyLossUsed);
  const personalDailyRemaining = Math.max(0, state.personalDailyStop - dailyLossUsed);
  const targetRemaining = Math.max(0, rules.targetBalance - state.currentBalance);
  const profitProgress = Math.max(0, state.currentBalance - rules.startingBalance);
  const permittedRiskNow = Math.max(0, Math.min(
    state.riskPerTrade,
    dailyLossRemaining,
    drawdownRemaining,
    personalDailyRemaining,
  ));

  return {
    ...state,
    riskReference,
    drawdownUsed,
    drawdownRemaining,
    dailyLossUsed,
    dailyLossRemaining,
    personalDailyRemaining,
    targetRemaining,
    profitProgress,
    permittedRiskNow,
    dailyLimitBreached: dailyLossUsed >= rules.maxDailyLoss,
    drawdownBreached: riskReference <= rules.drawdownFloor,
    personalStopReached: dailyLossUsed >= state.personalDailyStop,
    tradeLimitReached: state.tradesToday >= state.maxTradesPerDay,
  };
}