# Excel Learnings import

Date: 2026-08-02

## Source

- Workbook: `C:\Users\ericl\OneDrive\Trading Journal.xlsm`
- Sheet: `Learnings`
- Workbook opened read-only with VBA macros disabled

## Import rule

The sheet contains a curated set above the `End` marker and a lower working-copy area that repeats many of the same lessons. To avoid semantic duplicates, the import includes:

- Key Lessons: B7:B13
- Entry Model: B16:B22
- Stop Loss Strategy: B26:B27
- Personal Notes: B31:B36
- Unique session/behavior observations from G42:H48

The repeated B-column working notes below `End` are deliberately excluded.

Session observations are labeled as hypotheses to validate, not universal market rules.

## Re-run

```powershell
.\scripts\extract-excel-learnings.ps1
```

This regenerates `src/data/excelLearnings.json`.