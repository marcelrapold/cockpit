# Adobe Analytics — fertige Requests

Vorlagen für Fragen, die regelmässig gestellt werden. Platzhalter in spitzen Klammern
ersetzen. Alle Beispiele setzen die Header aus `references/api.md` voraus.

## Top-Seiten eines Monats

```json
{
  "rsid": "<RSID>",
  "globalFilters": [{ "type": "dateRange", "dateRange": "<START>T00:00:00.000/<ENDE_EXKLUSIV>T00:00:00.000" }],
  "metricContainer": { "metrics": [{ "columnId": "visits", "id": "metrics/visits" }] },
  "dimension": "variables/page",
  "settings": { "countRepeatInstances": true, "limit": 25, "page": 0, "nonesBehavior": "exclude-nones" }
}
```

## Tagesverlauf Visits

```json
{
  "rsid": "<RSID>",
  "globalFilters": [{ "type": "dateRange", "dateRange": "<START>T00:00:00.000/<ENDE_EXKLUSIV>T00:00:00.000" }],
  "metricContainer": { "metrics": [{ "columnId": "visits", "id": "metrics/visits" }] },
  "dimension": "variables/daterangeday",
  "settings": { "limit": 400, "page": 0 }
}
```

## Kanalverteilung

```json
{
  "rsid": "<RSID>",
  "globalFilters": [{ "type": "dateRange", "dateRange": "<START>T00:00:00.000/<ENDE_EXKLUSIV>T00:00:00.000" }],
  "metricContainer": {
    "metrics": [
      { "columnId": "visits", "id": "metrics/visits" },
      { "columnId": "bouncerate", "id": "metrics/bouncerate" }
    ]
  },
  "dimension": "variables/marketingchannel",
  "settings": { "limit": 25, "page": 0 }
}
```

## Kampagne im Detail

```json
{
  "rsid": "<RSID>",
  "globalFilters": [{ "type": "dateRange", "dateRange": "<START>T00:00:00.000/<ENDE_EXKLUSIV>T00:00:00.000" }],
  "metricContainer": {
    "metrics": [
      { "columnId": "visits", "id": "metrics/visits" },
      { "columnId": "visitors", "id": "metrics/visitors" }
    ]
  },
  "dimension": "variables/campaign",
  "settings": { "limit": 50, "page": 0, "nonesBehavior": "exclude-nones" }
}
```

## Vorjahresvergleich

Zwei Requests mit identischem Aufbau und verschobenem `dateRange`, danach im Code
zusammenführen. Die API kennt keinen eingebauten Vergleichszeitraum — was Workspace als
„Vergleich“ zeigt, sind ebenfalls zwei Abfragen.

Beim Vergleich Kalenderwochen gegen Kalenderwochen stellen, nicht Monat gegen Monat:
Monate haben unterschiedlich viele Werktage, und der ÖV-Verkehr folgt der Woche.
