# Search Console API — Referenz

## Token aus einem Service-Account

Kein manueller JWT-Bau nötig — die Google-Auth-Bibliothek der jeweiligen Sprache
übernimmt Signatur und Erneuerung:

```js
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const client = await auth.getClient();
const { token } = await client.getAccessToken();
```

Der Key gehört in einen Secret-Store, nie ins Repo. In Vercel als Environment Variable
mit dem vollständigen JSON als Wert.

## Endpunkte

| Zweck | Pfad |
|-------|------|
| Auswertung | `POST /webmasters/v3/sites/{siteUrl}/searchAnalytics/query` |
| Properties auflisten | `GET /webmasters/v3/sites` |
| Sitemaps | `GET /webmasters/v3/sites/{siteUrl}/sitemaps` |
| URL-Prüfung | `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` |

Basis: `https://searchconsole.googleapis.com`. `{siteUrl}` ist URL-kodiert.

## Request-Felder

| Feld | Bedeutung |
|------|-----------|
| `startDate`, `endDate` | `YYYY-MM-DD`, beide inklusiv, Zeitzone Pacific |
| `dimensions` | `query`, `page`, `country`, `device`, `searchAppearance`, `date` |
| `type` | `web` (Standard), `image`, `video`, `news`, `discover`, `googleNews` |
| `dimensionFilterGroups` | Filter, siehe unten |
| `aggregationType` | `auto`, `byPage`, `byProperty` |
| `rowLimit` | max. 25 000 |
| `startRow` | Versatz für Paginierung |
| `dataState` | `final` (Standard) oder `all` inkl. frischer Tage |

## Filter

```json
{
  "dimensionFilterGroups": [
    {
      "groupType": "and",
      "filters": [
        { "dimension": "page", "operator": "contains", "expression": "/fahrplan" },
        { "dimension": "country", "operator": "equals", "expression": "che" }
      ]
    }
  ]
}
```

Operatoren: `equals`, `notEquals`, `contains`, `notContains`, `includingRegex`,
`excludingRegex`. Ländercodes sind dreistellig und klein: `che`, `deu`, `aut`.

## Kontingente

Google begrenzt Abfragen pro Property und pro Projekt. Die geltenden Werte stehen in der
API-Dokumentation und ändern sich; für die Praxis reicht: Abfragen serialisieren, bei
`429` exponentiell zurücknehmen und Ergebnisse zwischenspeichern, statt denselben
Zeitraum mehrfach zu ziehen.

## Zeitzone

Die Search Console rechnet in Pacific Time. Ein „Tag“ deckt sich deshalb nicht mit einem
Schweizer Kalendertag. Bei Tagesvergleichen gegen Adobe oder Piano ist das die zweite
Fehlerquelle nach dem Datenverzug.
