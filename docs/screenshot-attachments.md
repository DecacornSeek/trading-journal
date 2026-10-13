# Screenshot attachments

Date restored: 2026-08-02

## Why this exists

The current repository and all three commits in its Git history contained no screenshot field, upload control, or trade-detail image renderer. The earlier screenshot feature was therefore not recoverable from this repository and was reimplemented for the local journal.

The reference workbook `C:\Users\ericl\OneDrive\Trading Journal.xlsm` confirms the intended Real Trading model: separate **Pre** and **Post** columns, followed by a Liquidation Heatmap column. The web journal mirrors the two requested screenshot phases and does not use the workbook's Paper Trading sheet.

## Usage

1. Open a new or existing trade.
2. In the Pre-Trade tab, add or drop screenshots showing the planned setup.
3. In the Post-Trade tab, add or drop screenshots showing the outcome and review state.
4. Preview or remove attachments before saving.
5. Open the saved trade to view separate pre-trade and post-trade galleries; select an image to open it full-size.

## Storage

- Screenshots are resized to a maximum of 1440 by 900 pixels and converted to compressed WebP.
- Each compressed attachment is limited to approximately 400 KB so the maximum eight images remain within typical browser local-storage limits.
- Each trade supports up to four pre-trade and four post-trade screenshots.
- Images are stored with the trade in browser local storage, so they are included in the existing JSON export.
- Clearing site data removes screenshots along with the rest of the locally stored journal.