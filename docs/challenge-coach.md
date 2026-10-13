# Breakout $10K Classic 1-step coach

Date added: 2026-08-02

## Source

Rules were transcribed from:

`C:\Users\ericl\OneDrive\MiroFish\orderflow-pro\prop challenges\breakout_prop_btc_rules.html`

## Firm rules

- $10,000 starting balance
- $1,000 profit target; $11,000 target balance
- $300 maximum daily loss
- $600 maximum static drawdown
- Fixed $9,400 account floor
- Daily reset at 00:30 UTC based on prior-day closing balance
- No time limit, minimum trading days, or consistency rule
- 5:1 maximum BTC/ETH leverage; 2:1 maximum altcoin leverage
- 0.04% commission per side; 0.08% round trip
- 0.09% daily overnight swap at 00:00 UTC
- News and weekend trading allowed
- Copy trading, latency/price arbitrage, pricing-error exploitation, and account sharing prohibited

## Personal guardrails

The defaults below are intentionally stricter than the firm limits and are clearly identified as personal rules in the UI and AI prompt:

- $50 planned risk per trade (0.5% of starting balance)
- $100 personal daily stop
- Maximum two trades per day
- Hard stop required with every order
- No trading while at work or distracted
- Thirty-minute break and a completely new setup after a loss
- Stop after two consecutive losses or any rule violation
- Minimum planned 2:1 reward:risk after estimated costs unless a tested exception is documented

## Live state

Settings stores user-updated current balance, current equity, day-start balance, planned risk, personal daily stop, maximum trades, and trades taken today. The coach uses the lower of balance and equity as its conservative risk reference.

The status card and prompt calculate:

- Remaining profit target
- Firm daily-loss buffer
- Buffer to the fixed drawdown floor
- Personal daily-loss buffer
- Maximum new risk allowed before additional fee/slippage allowance

These values are only as current as the snapshot entered by the user. The coach is instructed to ask for updated account state and open risk before declaring a proposed trade safe.

## Journal context rules

- Historical Excel EUR trades are behavioral evidence, not challenge PnL.
- July statement USD trades are historical unless explicitly marked as challenge trades.
- New trades default to **Challenge trade** while challenge tracking is enabled; the classification can be changed to Other / historical before saving.
- Paper trades do not count as real challenge performance.
- Unreviewed trades are not losses.
- Missing stop, discipline, and R:R data remains unknown rather than zero.
- Screenshot payloads are replaced with attachment counts before data is sent to the AI.

## Validation

Run:

```powershell
node .\scripts\validate-challenge-context.mjs
```

The validator checks the challenge arithmetic, stressed zero-risk behavior, hard-rule coverage, work-trading guardrail, currency separation, and screenshot-payload removal.