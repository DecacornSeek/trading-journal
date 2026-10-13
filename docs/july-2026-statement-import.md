# July 2026 statement import

Date imported: 2026-08-02

## Source

- File: `C:\Users\ericl\Downloads\Single-Currency_account_statement (1).pdf`
- Account: `854128`
- Currency: USD
- Statement period: 06 Jul 2026 10:00 to 02 Aug 2026 14:13 AEST
- Statement created: 02 Aug 2026 14:13 GMT+10
- Transaction timezone: AEST (UTC+10), matching the journal computer's Canberra/Melbourne/Sydney timezone at import

## Changes

- Added 48 completed positions to `src/data/july2026Trades.js`.
- Added a one-time, ID-based migration in `src/App.jsx`.
- Existing `tradelog_trades` browser data is preserved.
- Imported records are replaced with the verified dataset only when `tradelog_migration_july_2026_v3` is absent.
- Broker closing transaction IDs form stable journal IDs, so existing records are not duplicated.

## Import rules

- One journal record represents one completed position, not one transaction row.
- Position direction, size, entry, exit, and timestamps were paired from the statement transaction history.
- The two BTC positions entered on 31 July and liquidated on 1 August are included because their entry dates are in July.
- `pnl_dollars` is net economic P&L: settled P&L minus entry/exit commissions and attributable financing.
- Broker settled P&L, commissions, financing, size, and source are retained in each record's notes and import fields.
- Strategy-only fields absent from the broker statement, including stop loss, take profit, timeframe, session, confidence, discipline, tags beyond `Broker Import`, and trading notes, were not inferred.

## Reconciliation

| Check | Imported | Statement |
| --- | ---: | ---: |
| Completed positions | 48 | 48 paired positions |
| Unique journal IDs | 48 | 48 closing transactions |
| Settled P&L | -$55.46 | -$55.46 |
| Commissions | $217.36 | $217.36 |
| Financing | $11.50 | $11.50 |
| Net account change | -$284.32 | $9,715.68 balance less $10,000.00 deposit |

Imported net results: 18 wins and 30 losses after trading costs.

Instrument counts: BTCUSD 14, NEARUSD 13, SOLUSD 11, ONDOUSD 7, TAOUSD 3.

## Position-level verification

On 2026-08-02, all 96 transaction rows were independently extracted and divided into 48 openings and 48 closings. Positions were reconstructed by matching symbol, direction, size, time ordering, and the settled P&L implied by entry and exit prices. Commissions were summed from each matched opening and closing row; all 12 financing rows were attributed by opening order ID.

This check found three concurrent NEARUSD positions from 31 July whose closing transaction IDs had initially been assigned in the wrong order. Version 2 corrected the individual exit assignment while leaving statement totals unchanged:

| Entry (AEST) | Entry | Exit (AEST) | Exit | Settled P&L | Closing transaction |
| --- | ---: | --- | ---: | ---: | --- |
| 31 Jul 11:06 | 1.677 | 31 Jul 23:34 | 1.670 | -$7.00 | 5460726 |
| 31 Jul 11:09 | 1.682 | 31 Jul 23:35 | 1.669 | -$13.00 | 5460752 |
| 31 Jul 11:10 | 1.683 | 31 Jul 23:34 | 1.670 | -$13.00 | 5460714 |

## Accidental trade classification

On 2026-08-02, the trader confirmed that all NEARUSD and BTCUSD positions entered on 31 July were accidental positions opened while at work, with no stop loss, take profit, or planned setup. Version 3 classifies these five records as paper trades so they remain in the journal and retain their broker results, but are excluded from real-trade performance statistics.

The five accidental trades have combined net P&L of -$480.38. This classification does not change the statement reconciliation or the actual account balance.

## Demo data cleanup

Version 4 removes only exact matches for the eight bundled sample trades and 12 bundled sample learnings. These records were never present in the broker statement but had been included by the original application seed data, producing false revenge-trade and news-day warnings and contaminating performance totals and AI context.

The discipline insight now ignores missing scores. Broker-imported records have no discipline assessment because the statement does not contain one; an unknown value is no longer interpreted as a score of zero.

## Recovery

To rerun the trade migration, remove `tradelog_migration_july_2026_v4` from browser local storage and reload the app. Stable imported IDs prevent duplicates unless those IDs have been manually changed.

To rerun the demo-learning cleanup, remove `tradelog_migration_remove_demo_learnings_v1` and reload the app.

To remove this import, delete records whose IDs start with `abc-854128-`, set `tradelog_trades` to the remaining records, and remove the migration key.