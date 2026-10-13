# New trade capture fields

Date added: 2026-08-02

## Why these fields exist

The existing form already captured instrument, direction, timestamps, entry/stop/target, session, confidence, notes, screenshots, tags, result, exit, PnL, and discipline. It did not capture enough structured information to calculate normalized expectancy in R, compare setup performance, diagnose stop/exit efficiency, or separate strategy errors from execution errors.

## Added pre-trade fields

- Primary setup model
- Market regime
- News risk and gap classification
- Weekly VPOC direction
- Business zones A and B
- Daily road map
- Cash-open behavior
- Order-flow proof and observed speed/lethargy/absorption/front-running behavior
- Single A-to-B or fragmented execution approach
- Execution context: focused, at work, distracted, or emotional
- Position size
- Planned total dollar risk, including expected costs
- Estimated commission/slippage/funding costs
- Account balance and equity before entry
- Calculated planned risk as a percentage of equity

## Added post-trade fields

- Net PnL after actual costs
- Realized R, calculated as net PnL divided by planned dollar risk
- Actual costs
- Maximum adverse excursion (MAE) in dollars
- Maximum favorable excursion (MFE) in dollars
- Exit reason
- Plan adherence: yes, partly, or no
- Exact rule violation/deviation text

## Challenge validation

New trades default to Challenge while challenge tracking is enabled. Challenge trades require a setup model, daily road map, order-flow proof, position size, hard stop, planned dollar risk, a completed 11-point GO checklist, and plan-adherence result before a closed record can be saved. Imported and historical records are not forced to backfill fields that were not present in their source data.

These fields enable setup-level expectancy, payoff and win-rate analysis; risk-normalized R distributions; MAE/MFE stop and target analysis; cost drag; performance by regime/context; and rule-adherence leakage.