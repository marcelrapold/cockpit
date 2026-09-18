---
name: cloudflare-analytics
description: Wertet Traffic, Statuscodes, Cache-Trefferquote und Firewall-Ereignisse über die Cloudflare-GraphQL-Analytics-API aus — für Lastspitzen, Fehlerbilder und Bot-Verkehr auf CDN-Ebene.
status: review
owner: ZVV Digital / Platform
tags: [analytics, cloudflare, infrastruktur, api]
updated: 2026-08-25
requires:
  - CLOUDFLARE_API_TOKEN
  - CLOUDFLARE_ZONE_ID
---

# Cloudflare-Traffic auswerten

Zeigt, was am Rand des Netzes passiert, bevor ein Request die Anwendung erreicht:
Anfragevolumen, Statuscodes, Cache-Verhalten, blockierte Zugriffe. Die Quelle liegt vor
jedem Consent-Banner und vor jedem Analytics-Tag — sie sieht also auch, was Adobe und
Piano nie messen.

## Wann dieser Skill greift

- „Warum war die Seite um 07:30 langsam?“, „Woher kam die Lastspitze?“, „Wie viel davon waren Bots?“
- Fehlerbilder: Anstieg von 5xx, Einbruch der Cache-Trefferquote, auffällige Herkunftsländer.
- Gegenprobe, wenn Adobe/Piano einen Traffic-Einbruch zeigen: War der Verkehr weg, oder nur die Messung?
- **Nicht** für Nutzerverhalten und Conversions — dafür die Analytics-Skills.

## Voraussetzungen

| Was | Woher | Pflicht |
|-----|-------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare-Dashboard, Token mit Leserecht auf Analytics | ja |
| `CLOUDFLARE_ZONE_ID` | Übersichtsseite der Zone | ja |

Ein Token mit `Zone.Analytics: Read` reicht. Weitergehende Rechte sind für diesen Skill
nicht nötig und sollen nicht vergeben werden.

## Ablauf

### 1. Datensatz wählen

| Frage | Datensatz |
|-------|-----------|
| Anfragen, Statuscodes, Cache, Herkunft | `httpRequestsAdaptiveGroups` |
| Tages-/Stundensummen ohne Stichprobe | `httpRequests1dGroups`, `httpRequests1hGroups` |
| Blockierte und geprüfte Zugriffe | `firewallEventsAdaptive` |
| Worker-Ausführungen | `workersInvocationsAdaptive` |

### 2. Abfrage senden

```bash
curl -s -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query($zone:String!,$from:Time!,$to:Time!){viewer{zones(filter:{zoneTag:$zone}){httpRequestsAdaptiveGroups(limit:100,filter:{datetime_geq:$from,datetime_lt:$to},orderBy:[count_DESC]){count avg{sampleInterval} dimensions{edgeResponseStatus clientCountryName}}}}}",
    "variables": {
      "zone": "'"$CLOUDFLARE_ZONE_ID"'",
      "from": "2026-08-24T00:00:00Z",
      "to":   "2026-08-25T00:00:00Z"
    }
  }'
```

### 3. Stichprobe hochrechnen

Die `…Adaptive`-Datensätze liefern **gestichprobte** Daten. Der echte Wert ist
`count × avg.sampleInterval`. Bei `sampleInterval = 1` wurde nichts gestichprobt. Wer
`count` ungeprüft ausgibt, unterschätzt den Verkehr — je nach Volumen um Grössenordnungen.

Wenn es auf exakte Summen ankommt und die Zeitauflösung Tag oder Stunde genügt, stattdessen
`httpRequests1dGroups` / `httpRequests1hGroups` nehmen: die sind nicht gestichprobt.

### 4. Einordnen

Ein Ergebnis ohne Vergleichszeitraum ist wertlos. Immer denselben Wochentag der Vorwoche
mitziehen — ÖV-Traffic folgt dem Wochenrhythmus, nicht dem Kalendermonat.

## Fallstricke

- **`datetime_lt` ist exklusiv, `datetime_geq` inklusiv.** Ein voller Tag ist `00:00:00Z` bis `00:00:00Z` des Folgetags.
- **Alles ist UTC.** In der Schweiz sind das im Sommer zwei, im Winter eine Stunde Versatz. Eine „Spitze um 07:30“ liegt im Sommer bei `05:30Z`.
- **Stichprobe ignorieren ist der Klassiker.** Siehe Schritt 3.
- **Rückhaltedauer ist begrenzt und je Datensatz und Tarif verschieden.** Ältere Zeiträume kommen als leeres Ergebnis zurück, nicht als Fehler. Bei leerem Resultat zuerst den Zeitraum verdächtigen.
- **`limit` ist pro Datensatz gedeckelt** (10 000 als praktische Obergrenze). Grössere Auswertungen in Zeitscheiben zerlegen.
- **GraphQL-Fehler kommen mit HTTP 200.** Immer `errors[]` im Antwortkörper prüfen, nicht nur den Statuscode.
- **Bots sind kein Rauschen.** Ein Verkehrsanstieg ohne Entsprechung in Adobe/Piano ist meist automatisierter Zugriff — über `firewallEventsAdaptive` und die Bot-Score-Dimension gegenprüfen, bevor daraus eine Erfolgsmeldung wird.

## Ergebnisformat

Zeitreihe oder Rangliste mit hochgerechneten Werten, dazu Zone, Zeitraum in UTC **und**
lokaler Zeit, verwendeter Datensatz und ob gestichprobt wurde.

## Referenzen

- `references/graphql.md` — Schema-Erkundung, Datensätze, Filter, fertige Abfragen.
