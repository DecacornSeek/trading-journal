import workbookTrades from '../src/data/workbookTrades.json' with { type: 'json' };
import { JULY_2026_TRADES } from '../src/data/july2026Trades.js';
import { getChallengeMetrics } from '../src/data/challengeRules.js';
import { buildCoachSystemPrimer } from '../src/lib/coachContext.js';

const trades = [...JULY_2026_TRADES, ...workbookTrades];
const fresh = getChallengeMetrics({});
const stressed = getChallengeMetrics({
  challengeCurrentBalance: '9750',
  challengeCurrentEquity: '9700',
  challengeDayStartBalance: '9800',
  challengeRiskPerTrade: '50',
  challengePersonalDailyStop: '100',
});
const primer = buildCoachSystemPrimer({ trades, learnings: [], settings: {} });

const checks = {
  freshRisk: fresh.permittedRiskNow,
  freshFloorBuffer: fresh.drawdownRemaining,
  freshTarget: fresh.targetRemaining,
  stressedDailyUsed: stressed.dailyLossUsed,
  stressedFirmDailyRemaining: stressed.dailyLossRemaining,
  stressedPersonalRemaining: stressed.personalDailyRemaining,
  stressedRisk: stressed.permittedRiskNow,
  hasTarget: primer.includes('target balance $11000.00'),
  hasDailyLimit: primer.includes('Maximum daily loss: $300.00'),
  hasFloor: primer.includes('Permanent account floor: $9400.00'),
  hasReset: primer.includes('00:30 UTC'),
  hasCosts: primer.includes('0.08% round trip'),
  hasWorkRule: primer.includes('No trading while at work'),
  hasCurrencySeparation: primer.includes('Never add EUR and USD'),
  hasContextFirstFramework: primer.includes('CONTEXT-FIRST 11-POINT FRAMEWORK'),
  hasOrderFlowTactics: primer.includes('sustained execution speed') && primer.includes('absorption') && primer.includes('front-running'),
  hasFragmentedRisk: primer.includes('aggregate campaign risk'),
  hasEvidenceBoundaries: primer.includes('not verified facts') && primer.includes('Do not calculate Kelly sizing'),
  hasImagePath: primer.includes('/workbook-images/'),
  hasImageData: primer.includes('data:image'),
};

console.log(checks);

const requiredPromptChecks = [
  checks.hasTarget,
  checks.hasDailyLimit,
  checks.hasFloor,
  checks.hasReset,
  checks.hasCosts,
  checks.hasWorkRule,
  checks.hasCurrencySeparation,
  checks.hasContextFirstFramework,
  checks.hasOrderFlowTactics,
  checks.hasFragmentedRisk,
  checks.hasEvidenceBoundaries,
];

if (
  fresh.permittedRiskNow !== 50
  || fresh.drawdownRemaining !== 600
  || fresh.targetRemaining !== 1000
  || stressed.dailyLossUsed !== 100
  || stressed.dailyLossRemaining !== 200
  || stressed.personalDailyRemaining !== 0
  || stressed.permittedRiskNow !== 0
  || requiredPromptChecks.includes(false)
  || checks.hasImagePath
  || checks.hasImageData
) {
  process.exit(1);
}