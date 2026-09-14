---
name: adobe-analytics
description: Beantwortet Fragen zu Seitenaufrufen, Visits, Kampagnen und Conversions aus Adobe Analytics über die Reporting-API 2.0 — inklusive Authentifizierung, Report-Request, Breakdowns und Paginierung.
status: review
owner: ZVV Digital / Web-Analytics
tags: [analytics, adobe-analytics, reporting, api]
updated: 2026-08-25
requires:
  - ADOBE_CLIENT_ID
  - ADOBE_CLIENT_SECRET
  - ADOBE_GLOBAL_COMPANY_ID
  - ADOBE_RSID
---

# Adobe Analytics abfragen

Holt Kennzahlen aus einer Adobe-Analytics-Report-Suite über die Reporting-API 2.0 — dieselbe API, die auch Analysis Workspace benutzt. Wenn eine Zahl in Workspace steht, lässt sie sich hierüber reproduzieren.

## Wann dieser Skill greift

- „Wie viele Visits hatte /fahrplan letzten Monat?“, „Top-Seiten der Woche“, „Wie lief Kampagne X?“
- Jede Frage nach Adobe-Kennzahlen, die wiederholbar beantwortet werden soll statt einmalig im Workspace geklickt.
- **Nicht** für Klicks aus der Google-Suche — dafür `google-search-console`. **Nicht** für Traffic auf CDN-Ebene — dafür `cloudflare-analytics`.

## Voraussetzungen

| Was | Woher | Pflicht |
|-----|-------|---------|
| `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET` | Adobe Developer Console, Projekt mit OAuth-Server-to-Server-Credential | ja |
| `ADOBE_GLOBAL_COMPANY_ID` | einmalig via `/discovery/me` ermitteln, dann fest hinterlegen | ja |
| `ADOBE_RSID` | Report-Suite-ID der abzufragenden Property | ja |

Das Credential braucht den Product Profile mit Zugriff auf die Report Suite. Fehlt er, antwortet die API mit leeren Ergebnissen statt mit einem Fehler — siehe Fallstricke.

## Ablauf

### 1. Access-Token holen

Server-to-Server, gültig 24 h. Token cachen, nicht pro Request neu holen.

```bash
curl -s -X POST https://ims-na1.adobelogin.com/ims/token/v3 \
  -d grant_type=client_credentials \
  -d client_id="$ADOBE_CLIENT_ID" \
  -d client_secret="$ADOBE_CLIENT_SECRET" \
  -d scope="openid,AdobeID,additional_info.projectedProductContext,session"
```

### 2. Global Company ID bestätigen (einmalig)

```bash
curl -s https://analytics.adobe.io/discovery/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-api-key: $ADOBE_CLIENT_ID"
```

Die ID steckt in `imsOrgs[].companies[].globalCompanyId`. Danach fest in die Umgebung, nicht bei jedem Lauf erneut abfragen.

### 3. Report anfragen

Ein Report = eine Dimension, ein bis mehrere Metriken, ein Zeitraum. Beispiel Top-Seiten nach Visits:

```bash
curl -s -X POST "https://analytics.adobe.io/api/$ADOBE_GLOBAL_COMPANY_ID/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-api-key: $ADOBE_CLIENT_ID" \
  -H "x-proxy-global-company-id: $ADOBE_GLOBAL_COMPANY_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "rsid": "'"$ADOBE_RSID"'",
    "globalFilters": [
      { "type": "dateRange", "dateRange": "2026-08-01T00:00:00.000/2026-09-01T00:00:00.000" }
    ],
    "metricContainer": {
      "metrics": [
        { "columnId": "visits", "id": "metrics/visits" },
        { "columnId": "pageviews", "id": "metrics/pageviews" }
      ]
    },
    "dimension": "variables/page",
    "settings": { "countRepeatInstances": true, "limit": 50, "page": 0 }
  }'
```

Antwort: `rows[]` mit `value` (Dimensionswert), `itemId` (für Breakdowns) und `data[]` in der Reihenfolge der `metrics`. Gesamtwerte stehen in `summaryData.totals`.

### 4. Bei Bedarf aufbrechen (Breakdown)

Dimension B innerhalb eines Werts von Dimension A braucht dessen `itemId` aus Schritt 3 — es gibt keinen Weg, beide Dimensionen in einem Request zu kreuzen. Muster in `references/api.md`.

### 5. Paginieren

`settings.page` hochzählen, bis `page >= totalPages`. `limit` über 50 000 wird nicht bedient; für grosse Auszüge stattdessen die Data-Warehouse-Schnittstelle wählen.

## Fallstricke

- **Enddatum ist exklusiv.** `2026-08-01T00:00:00.000/2026-09-01T00:00:00.000` ist der ganze August. Wer `08-31` als Ende setzt, verliert den letzten Tag.
- **Zeitzone ist die der Report Suite**, nicht UTC und nicht die des aufrufenden Systems. Bei Tagesgrenzen relevant.
- **Fehlende Berechtigung sieht aus wie fehlender Traffic.** Leere `rows[]` bei plausiblem Zeitraum: zuerst prüfen, ob das Credential die Report Suite im Product Profile hat.
- **`metrics/visits` ≠ `metrics/uniquevisitors` ≠ `metrics/occurrences`.** Vor dem Report festlegen, welche Frage gestellt ist; Visits sind Sitzungen, keine Personen.
- **`countRepeatInstances`** verändert Instance-basierte Metriken. Für Workspace-Vergleichbarkeit auf `true` lassen.
- **Segmente sind nicht optional-gleichwertig.** Ein Workspace-Panel mit Segment liefert andere Zahlen als derselbe Request ohne. Segment-ID mit in `globalFilters` aufnehmen.
- **HTTP 429** heisst Drosselung: exponentiell zurücknehmen und wiederholen, nicht parallel weiterfeuern. Adobe throttelt pro Company; die aktuell geltenden Grenzwerte in der Adobe-Dokumentation nachsehen, sie ändern sich.

## Ergebnisformat

Tabelle mit Dimensionswert und je Metrik einer Spalte, dazu immer: Report Suite, Zeitraum mit Zeitzone, gesetzte Segmente. Ohne diese drei Angaben ist eine Adobe-Zahl nicht überprüfbar.

## Referenzen

- `references/api.md` — Request-Aufbau, Breakdowns, Metrik- und Dimensions-IDs, Fehlercodes.
- `references/recipes.md` — fertige Requests für wiederkehrende ZVV-Fragen.
