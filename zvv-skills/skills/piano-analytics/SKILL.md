---
name: piano-analytics
description: Fragt Besuche, Seitenaufrufe, Quellen und Custom-Events aus Piano Analytics (vormals AT Internet) über die Data-API ab — Authentifizierung, getData-Request, Filter, Paginierung und Abgleich mit Adobe.
status: review
owner: ZVV Digital / Web-Analytics
tags: [analytics, piano, reporting, api]
updated: 2026-08-25
requires:
  - PIANO_ACCESS_KEY
  - PIANO_SECRET_KEY
  - PIANO_SITE_ID
---

# Piano Analytics abfragen

Liest Kennzahlen aus Piano Analytics über die Data-API. Piano ist beim ZVV die zweite
Messquelle neben Adobe; dieser Skill liefert die Zahlen und sagt, wann ein Vergleich der
beiden überhaupt zulässig ist.

## Wann dieser Skill greift

- Fragen nach Besuchen, Seitenaufrufen, Einstiegsquellen oder Custom-Events, die in Piano gemessen werden.
- Gegenprüfung einer Adobe-Zahl aus der zweiten Quelle.
- **Nicht**, wenn die Frage nach Adobe-spezifischen eVars/Events geht — dann `adobe-analytics`.

## Voraussetzungen

| Was | Woher | Pflicht |
|-----|-------|---------|
| `PIANO_ACCESS_KEY`, `PIANO_SECRET_KEY` | Piano-Analytics-Oberfläche, Bereich API-Keys | ja |
| `PIANO_SITE_ID` | numerische Site-ID der Property | ja |

Der Key wird als **ein** Header übergeben, die beiden Teile mit Unterstrich verbunden:
`x-api-key: <ACCESS_KEY>_<SECRET_KEY>`.

## Ablauf

### 1. Frage in Spalten übersetzen

Ein `getData`-Request ist eine Liste von `columns`: Properties (Dimensionen) und Metriken
gemischt, in der gewünschten Ausgabereihenfolge. Metriken tragen das Präfix `m_`.

### 2. Request senden

```bash
curl -s -X POST https://api.atinternet.io/v3/data/getData \
  -H "x-api-key: ${PIANO_ACCESS_KEY}_${PIANO_SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "space": { "s": ['"$PIANO_SITE_ID"'] },
    "columns": ["page", "m_visits", "m_page_displays"],
    "period": { "p1": [{ "type": "D", "start": "2026-08-01", "end": "2026-08-31" }] },
    "sort": ["-m_visits"],
    "max-results": 100,
    "page-num": 1,
    "options": { "ignore_null_properties": true }
  }'
```

Anders als bei Adobe ist `end` hier **inklusiv**.

### 3. Ergebnismenge kennen, bevor paginiert wird

`POST /v3/data/getRowCount` mit demselben Körper liefert die Zeilenzahl, `POST /v3/data/getTotal`
die Gesamtsummen der Metriken. Beides vor einer Schleife über `page-num` abfragen, statt
blind weiterzublättern.

### 4. Paginieren

`page-num` beginnt bei **1**, nicht bei 0. Hochzählen, bis die Summe der gelieferten Zeilen
der Zahl aus `getRowCount` entspricht.

## Fallstricke

- **`end` ist inklusiv, bei Adobe exklusiv.** Der häufigste Fehler beim Vergleich beider Systeme: ein Tag Differenz.
- **`page-num` startet bei 1**, Adobes `settings.page` bei 0. Beim Portieren von Code prüfen.
- **Piano und Adobe zählen unterschiedlich.** Sitzungsdefinition, Bot-Filter und Consent-Behandlung weichen ab. Abweichungen im niedrigen zweistelligen Prozentbereich sind normal und kein Datenfehler — als Vergleich taugt der Trend, nicht der absolute Wert.
- **Consent verändert die Grundgesamtheit.** Ohne Einwilligung gemessene Sitzungen erscheinen je nach Konfiguration gar nicht oder anonymisiert. Vor jedem Quellenvergleich klären, welches Regime in beiden Systemen aktiv war.
- **`ignore_null_properties`** bestimmt, ob Zeilen ohne Wert erscheinen. Umschalten verändert die Zeilensumme, nicht den Gesamtwert.
- **Endpunkt-Host im Wandel.** Aus der AT-Internet-Historie ist `api.atinternet.io` der etablierte Host. Schlägt er mit 404/301 fehl, den aktuellen Data-API-Host in der Piano-Dokumentation nachschlagen, statt den Request umzubauen.

## Ergebnisformat

Tabelle in der Reihenfolge der angeforderten `columns`, dazu Site-ID, Zeitraum
(inklusiv) und der Zustand von `ignore_null_properties`.

## Referenzen

- `references/api.md` — Request-Felder, Filtersyntax, gebräuchliche Properties und Metriken.
