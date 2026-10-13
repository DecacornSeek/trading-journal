# Excel Real Trading import

Date: 2026-08-02

## Source and scope

- Source: `C:\Users\ericl\OneDrive\Trading Journal.xlsm`
- Imported sheet: `Real Trading`
- Source rows: 4 through 78
- The workbook is opened read-only with VBA macros disabled.
- `Paper trading` is deliberately excluded.

## Field mapping

| Workbook | Web journal |
| --- | --- |
| B Time + C Day | `date` in the workbook's local wall-clock time |
| D Pre | `pre_screenshots` |
| E Post | `post_screenshots` |
| G Coin | `pair` |
| H BTC outlook | `btc_outlook` |
| I Timeframe | `timeframe` |
| J Long/Short | `direction` |
| K Portfolio Risk | `portfolio_risk` |
| L Win/Loss | `win_loss` and `status` |
| M PnL | signed `pnl_dollars` with `pnl_currency: EUR` |
| N Confidence | `confidence` |
| O Duration | `duration_original` |
| P/Q Pivot fields | `pivot_today` / `pivot_yesterday` |
| R Pre Checklist | `pre_notes` |
| S Post Notes | `post_notes` |

Rows without a result are preserved as `unreviewed`, not guessed to be wins, losses, or open positions. Workbook losses are normalized to negative values even where the source stores the loss magnitude as a positive number.

The Statistics sheet formats PnL as euros. Workbook PnL must therefore remain EUR and must not be silently added to the July statement's USD PnL.

## Images

Excel stores the Real Trading images as Picture-in-Cell rich data rather than worksheet shapes. The extractor resolves worksheet value metadata through the workbook rich-data relationship tables and copies only linked pre/post media into `public/workbook-images`.

Liquidation heatmaps are counted in the manifest but are not imported because the requested web model has separate pre-trade and post-trade screenshots.

## Imported result

- 62 Real Trading records imported
- 56 closed records: 35 wins and 21 losses
- 6 records preserved as unreviewed
- 47 records with known PnL, totaling +€121.75 after normalizing loss signs
- 55 pre-trade screenshots and 55 post-trade screenshots linked to imported records
- 10 separator/date-only rows excluded: 36, 45, 52, 54, 56, 57, 58, 59, 68, and 72
- 8 liquidation heatmap images counted but not imported

Browser migration validation confirmed 110 unique journal records after merging: 62 Excel records plus the existing 48 July statement records. Existing edited July objects were preserved rather than regenerated.

## Re-running

From the project root:

```powershell
.\scripts\extract-real-trading-workbook.ps1
```

The script regenerates `src/data/workbookTrades.json`, `src/data/workbookImportManifest.json`, and `public/workbook-images`.