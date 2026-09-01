# Adobe Analytics Reporting API 2.0 — Referenz

Nur nachschlagen, wenn `SKILL.md` nicht reicht. Alle Angaben gegen die offizielle
Dokumentation prüfen, wenn ein Request unerwartet scheitert: Adobe ändert Scopes und
Limits ohne Ankündigung im Detail.

## Endpunkte

| Zweck | Methode + Pfad |
|-------|----------------|
| Token | `POST https://ims-na1.adobelogin.com/ims/token/v3` |
| Company-ID | `GET https://analytics.adobe.io/discovery/me` |
| Report | `POST https://analytics.adobe.io/api/{globalCompanyId}/reports` |
| Dimensionen | `GET https://analytics.adobe.io/api/{globalCompanyId}/dimensions?rsid={rsid}` |
| Metriken | `GET https://analytics.adobe.io/api/{globalCompanyId}/metrics?rsid={rsid}` |
| Segmente | `GET https://analytics.adobe.io/api/{globalCompanyId}/segments?rsid={rsid}` |

Pflicht-Header auf allen `analytics.adobe.io`-Aufrufen:

```
Authorization: Bearer <token>
x-api-key: <client_id>
x-proxy-global-company-id: <globalCompanyId>
```

## Request-Körper

```jsonc
{
  "rsid": "zvvprod",
  "globalFilters": [
    { "type": "dateRange", "dateRange": "2026-08-01T00:00:00.000/2026-09-01T00:00:00.000" },
    { "type": "segment", "segmentId": "s300000123_5f2a…" }   // optional
  ],
  "metricContainer": {
    "metrics": [
      { "columnId": "visits", "id": "metrics/visits" }
    ]
  },
  "dimension": "variables/page",
  "settings": {
    "countRepeatInstances": true,
    "limit": 50,
    "page": 0,
    "nonesBehavior": "exclude-nones"
  }
}
```

- `columnId` ist frei wählbar und bestimmt die Position in `rows[].data[]`.
- `nonesBehavior: "exclude-nones"` blendet die Sammelzeile „Unspecified“ aus. Weglassen, wenn die Summe der Zeilen dem Gesamtwert entsprechen soll.
- `settings.dimensionSort: "asc" | "desc"` sortiert nach Dimensionswert statt nach Metrik.

## Antwort

```jsonc
{
  "totalPages": 3,
  "numberOfElements": 50,
  "totalElements": 128,
  "columns": { "columnIds": ["visits"] },
  "rows": [
    { "itemId": "1234567890", "value": "/fahrplan", "data": [48213] }
  ],
  "summaryData": { "totals": [193045] }
}
```

`summaryData.totals` ist der Gesamtwert über alle Zeilen — auch über die nicht
zurückgegebenen. Er ist nicht die Summe der Seite.

## Breakdown

Zweistufig. Zuerst Dimension A abfragen, `itemId` merken, dann A als Filter auf die
Metrik legen und B als `dimension` setzen:

```jsonc
{
  "rsid": "zvvprod",
  "globalFilters": [{ "type": "dateRange", "dateRange": "…" }],
  "metricContainer": {
    "metrics": [
      { "columnId": "visits", "id": "metrics/visits", "filters": ["0"] }
    ],
    "metricFilters": [
      { "id": "0", "type": "breakdown", "dimension": "variables/page", "itemId": "1234567890" }
    ]
  },
  "dimension": "variables/referrertype",
  "settings": { "limit": 20, "page": 0 }
}
```

Jede weitere Ebene ist ein weiterer Request. Bei n Zeilen der oberen Ebene sind das n
Requests — vor dem Start abschätzen und Drosselung einplanen.

## Häufige IDs

Dimensionen: `variables/page`, `variables/pagename`, `variables/referrertype`,
`variables/referringdomain`, `variables/campaign`, `variables/marketingchannel`,
`variables/mobiledevicetype`, `variables/geocountry`, `variables/daterangeday`,
`variables/daterangeweek`, `variables/daterangemonth`.

Metriken: `metrics/visits`, `metrics/visitors`, `metrics/uniquevisitors`,
`metrics/pageviews`, `metrics/occurrences`, `metrics/bounces`, `metrics/bouncerate`,
`metrics/entries`, `metrics/exits`, `metrics/averagetimespentonsite`.

eVars und Events heissen `variables/evar12` bzw. `metrics/event7`. Welche Nummer welche
Bedeutung hat, steht in der Solution Design Reference des ZVV — nicht raten, sondern über
den `/dimensions`-Endpunkt auflösen, der die konfigurierten Klartextnamen liefert.

## Zeitliche Verläufe

Für eine Zeitreihe ist die Dimension die Zeit: `variables/daterangeday` mit dem
gewünschten Gesamtzeitraum als `globalFilters`. Ein Request pro Tag ist der falsche Weg.

## Fehler

| Status | Bedeutung | Reaktion |
|--------|-----------|----------|
| 400 | Request-Körper ungültig, meist Metrik-/Dimensions-ID | ID über `/metrics` bzw. `/dimensions` prüfen |
| 401 | Token abgelaufen oder Scope falsch | neues Token, Scope-Liste prüfen |
| 403 | Credential ohne Zugriff auf die Report Suite | Product Profile in der Adobe Admin Console |
| 429 | Drosselung | exponentiell zurücknehmen, Requests serialisieren |
