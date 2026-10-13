# Replay-Journal — Erfassungsablauf

Ziel: 200–300 Replay-Trades (inkl. No-Trades) erfassen. Aus Erics Beschreibungen
soll später eine wiederholbare Strategie entstehen.

**Prinzip: Live wird nur erfasst, was sich nachträglich nicht ehrlich rekonstruieren
lässt.** Pivots, Volumen, Profile, CVD usw. berechnet später ein Skript aus den
Kursdaten (nur Daten bis zur Entry-Bar).

## Was Eric macht

Im Replay schreibt Eric in normalen Worten, was passiert und warum:

> Eintrag: Preis seit 2h unter Vortages-Pivot, jetzt Rückkehr mit viel Volumen.
> Long, Stop unter dem Tief, Ziel Pivot.

Bei No-Trades genauso: `Eintrag: kein Trade, weil …`

Beim Ausstieg: `Exit` (optional mit Kommentar).

## Was Claude bei „Eintrag“ macht

1. `replay_status` → Zeit der aktuellen Replay-Bar, **in UTC umrechnen**
   (Chart steht auf Australia/Sydney).
2. Symbol + Timeframe aus dem Chart lesen.
3. `capture_screenshot` region `chart` → `screenshots/Txxx_before.png`.
4. Erics Text **wörtlich** in `text` speichern. Nicht umformulieren, nicht bewerten.
5. Aus dem Text ableiten: `entscheidung`, `richtung`. Entry = Close der Replay-Bar
   (aus den Daten, nie vom Screenshot). Stop/Ziel als Preis, wenn Eric einen nennt
   oder ein Positionswerkzeug gezeichnet ist.
6. Fehlt bei einem Trade Stop oder Ziel: **eine** kurze Rückfrage, Antwort wörtlich
   in `fragen[]`. Sonst keine Fragen.
7. Eine Zeile an `journal.jsonl` anhängen. `ergebnis` bleibt `null`.

## Was Claude bei „Exit“ macht

1. Replay-Zeit (UTC) + Exit-Preis aus den Daten.
2. `screenshots/Txxx_after.png`.
3. `ergebnis` ergänzen: `exit`, `exit_zeit_utc`, `exit_grund`, `r`
   (r = (Exit − Entry) / (Entry − Stop), bei Short umgekehrt). Erics Kommentar wörtlich.
4. Management zwischendurch (Stop nachgezogen etc.) → `management[]` mit Zeit + Wortlaut.

## Regeln

- **Begründung vor Ergebnis.** Einträge nach dem Ergebnis bekommen
  `"erfasst": "nachtraeglich"` und zählen nicht für die Auswertung.
- **Keine Bars nach der aktuellen Replay-Bar** lesen oder kommentieren, solange
  der Trade offen ist.
- **Preise aus Daten, nie aus dem Screenshot.**
- **No-Trades genauso speichern** — mit hypothetischem Entry/Stop/Ziel, falls Eric einen nennt.
- **Keine Statistik** vor ca. 100 gültigen Einträgen. Nach 20–30 Einträgen:
  wiederkehrende Ereignisse aus Erics Texten clustern → das werden die Setups.
- Erst mal **ein Symbol, ein Timeframe**. Am besten ein Symbol mit echtem Volumen
  (z. B. BINANCE:BTCUSDT), damit die nachträgliche Berechnung dieselben Daten nutzt.

## TradingView-MCP — bekannte Fallen

- Läuft nur in einer lokalen Claude-Code-Session (Bridge unter `C:\Users\ericl\tradingview-mcp`).
- Fürs Journal **keinen Pine-Code** einfügen. Skript „Nitro-Trades“ nicht anfassen.
- `replay_trade` kann nur Market buy/sell/close, keine Stops.
- Positionswerkzeug: `stopLevel`/`profitLevel` sind Abstände in Ticks, keine Preise.
  Long: Stop = Entry − stopLevel · Tick.

## Format einer Zeile (`journal.jsonl`, schema_version 0.2)

```json
{
  "id": "T002",
  "schema_version": "0.2",
  "erfasst": "live",
  "symbol": "BINANCE:BTCUSDT",
  "timeframe": "15",
  "zeit_utc": "2026-10-13T08:15:00Z",
  "text": "Preis seit 2h unter Vortages-Pivot, jetzt Rückkehr mit viel Volumen. Long, Stop unter dem Tief, Ziel Pivot.",
  "entscheidung": "trade",
  "richtung": "long",
  "entry": 62150.0,
  "stop": 61980.0,
  "ziel": 62600.0,
  "screenshots": { "before": "T002_before.png", "after": null },
  "fragen": [],
  "management": [],
  "ergebnis": null,
  "berechnet": null
}
```

- `entscheidung`: `trade` | `kein_trade`
- `richtung`: `long` | `short` | `null`
- `ergebnis` nach Exit: `{ "exit": …, "exit_zeit_utc": "…", "exit_grund": "ziel|stop|manuell|breakeven", "r": …, "kommentar": "…" }`
- `berechnet` füllt später das Auswertungs-Skript (Pivots, Volumen vs. Vortage, Profile, CVD).
  Nie von Hand.
- T001 (v0.1, nachträglich) aus dem alten OneDrive-Ordner kann unverändert dazukopiert werden.
