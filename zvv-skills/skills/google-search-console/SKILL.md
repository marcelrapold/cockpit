---
name: google-search-console
description: Zieht Impressionen, Klicks, CTR und Positionen aus der Google Search Console Search-Analytics-API — für Suchbegriffe, Landingpages, Länder und Geräte, inklusive Umgang mit Datenverzug und anonymisierten Suchanfragen.
status: review
owner: ZVV Digital / SEO
tags: [analytics, seo, google-search-console, api]
updated: 2026-08-25
requires:
  - GOOGLE_SERVICE_ACCOUNT_JSON
  - GSC_SITE_URL
---

# Google Search Console abfragen

Beantwortet, wie zvv.ch in der Google-Suche gefunden wird: mit welchen Begriffen, auf
welchen Seiten, mit welcher Position. Quelle ist die Search-Analytics-API — dieselben
Daten wie im Leistungsbericht der Oberfläche.

## Wann dieser Skill greift

- „Für welche Begriffe ranken wir?“, „Welche Seite verliert Klicks?“, „Wie hat sich die Position entwickelt?“
- Prüfung nach einem Relaunch oder einer URL-Umstellung.
- **Nicht** für Verhalten auf der Website nach dem Klick — dafür `adobe-analytics` oder `piano-analytics`.

## Voraussetzungen

| Was | Woher | Pflicht |
|-----|-------|---------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google-Cloud-Projekt, Service-Account mit Key | ja |
| `GSC_SITE_URL` | Property-Kennung, z. B. `sc-domain:zvv.ch` oder `https://www.zvv.ch/` | ja |

Der Service-Account muss in der Search Console **als Nutzer der Property hinzugefügt**
sein. Ohne diesen Schritt liefert die API 403, egal wie korrekt der Key ist. Scope:
`https://www.googleapis.com/auth/webmasters.readonly`.

## Ablauf

### 1. Property-Kennung korrekt kodieren

Die `siteUrl` steht im Pfad und muss URL-kodiert sein:
`sc-domain:zvv.ch` → `sc-domain%3Azvv.ch`, `https://www.zvv.ch/` → `https%3A%2F%2Fwww.zvv.ch%2F`.

Domain-Property (`sc-domain:`) und URL-Präfix-Property sind verschiedene Datentöpfe. Erstere
umfasst alle Subdomains und Protokolle, letztere nur den exakten Präfix.

### 2. Abfrage senden

```bash
curl -s -X POST \
  "https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Azvv.ch/searchAnalytics/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-08-01",
    "endDate": "2026-08-31",
    "dimensions": ["query"],
    "type": "web",
    "rowLimit": 1000,
    "startRow": 0,
    "dataState": "final"
  }'
```

Beide Datumsgrenzen sind **inklusiv**. Antwortzeilen enthalten `keys[]` in der Reihenfolge
der `dimensions` sowie `clicks`, `impressions`, `ctr`, `position`.

### 3. Paginieren

`rowLimit` maximal 25 000, `startRow` in Schritten von `rowLimit` erhöhen, bis eine Antwort
weniger Zeilen liefert als angefordert.

### 4. Zeitraum bestimmen

Für Trends `["date"]` als Dimension nehmen. Für Ursachensuche zwei Dimensionen kombinieren,
etwa `["page", "query"]` — das erzeugt die Kreuztabelle direkt, ohne Zweitabfrage.

## Fallstricke

- **Zwei bis drei Tage Verzug.** „Gestern“ existiert in der Search Console nicht. Ein Report bis zum aktuellen Tag liefert stillschweigend zu niedrige Werte.
- **`dataState: "final"` vs. `"all"`.** `all` schliesst frische, noch unvollständige Tage ein. Für belastbare Berichte `final`, für tagesaktuelle Beobachtung `all` — und den Unterschied im Ergebnis benennen.
- **Anonymisierte Suchanfragen.** Selten gestellte Begriffe gibt Google aus Datenschutzgründen nicht heraus. Die Summe aller `query`-Zeilen ist deshalb **kleiner** als der Gesamtwert ohne Dimension. Das ist kein Fehler: Gesamtsummen immer ohne `dimensions` abfragen, nicht aus Zeilen aufaddieren.
- **`position` ist ein Mittelwert über Impressionen**, nicht der Rang einer einzelnen Abfrage. Ein Sprung von 8,4 auf 6,1 kann allein aus verschobenem Suchvolumen entstehen.
- **`ctr` ist ein Anteil (0–1)**, nicht Prozent. Vor der Ausgabe mit 100 multiplizieren.
- **16 Monate Historie.** Ältere Zeiträume sind nicht abrufbar. Wer Jahresvergleiche braucht, muss die Daten laufend wegschreiben.
- **`type`** trennt `web`, `image`, `video`, `news`, `discover`, `googleNews`. Ohne Angabe wird `web` abgefragt — Discover-Traffic fehlt dann vollständig.

## Ergebnisformat

Tabelle mit Dimensionsspalten, Klicks, Impressionen, CTR in Prozent, Position auf eine
Nachkommastelle. Kopfzeile mit Property, Zeitraum, `type` und `dataState`. Bei
Zeilensummen den Hinweis auf anonymisierte Anfragen mitgeben.

## Referenzen

- `references/api.md` — Authentifizierung, Request-Felder, Filter, Kontingente.
