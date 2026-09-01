# Piano Analytics Data API — Referenz

## Endpunkte

| Zweck | Pfad |
|-------|------|
| Daten | `POST /v3/data/getData` |
| Zeilenzahl | `POST /v3/data/getRowCount` |
| Gesamtsummen | `POST /v3/data/getTotal` |

Basis-Host: `https://api.atinternet.io`. Authentifizierung über den Header
`x-api-key: <ACCESS_KEY>_<SECRET_KEY>`.

## Request-Körper

```jsonc
{
  "space":   { "s": [123456] },              // eine oder mehrere Site-IDs
  "columns": ["page", "m_visits"],           // Properties und Metriken gemischt
  "period":  {
    "p1": [{ "type": "D", "start": "2026-08-01", "end": "2026-08-31" }],
    "p2": [{ "type": "D", "start": "2025-08-01", "end": "2025-08-31" }]   // optional: Vergleich
  },
  "sort": ["-m_visits"],                     // Minus = absteigend
  "filter": { … },
  "max-results": 100,
  "page-num": 1,
  "options": { "ignore_null_properties": true }
}
```

`type: "D"` sind absolute Tagesgrenzen. Relative Zeiträume (`"type": "R"` mit `granularity`
und `offset`) sind für wiederkehrende Reports bequem, machen ein Ergebnis aber
nicht reproduzierbar — für Auswertungen, die später belegt werden müssen, absolute
Daten setzen.

## Filter

Boolesche Verknüpfung über `$AND` / `$OR`, Vergleiche als Operator-Objekt:

```json
{
  "filter": {
    "$AND": [
      { "page": { "$contains": "fahrplan" } },
      { "device_type": { "$in": ["mobile", "tablet"] } }
    ]
  }
}
```

Gebräuchliche Operatoren: `$eq`, `$neq`, `$in`, `$nin`, `$contains`, `$start`, `$gt`, `$lt`,
`$na` (kein Wert erfasst).

## Properties und Metriken

Properties: `page`, `page_chapter1`, `page_chapter2`, `page_chapter3`, `page_full_name`,
`src_referrer_type`, `src_referrer_site`, `device_type`, `os_group`, `browser_group`,
`geo_country`, `geo_region`, `date`, `date_week`, `date_month`.

Metriken: `m_visits`, `m_unique_visitors`, `m_page_displays`, `m_bounce_rate`,
`m_avg_time_spent`, `m_events`.

Die exakte Liste hängt an der Konfiguration der Property. Bei unbekanntem Namen nicht
raten: In der Piano-Oberfläche im Data-Model-Bereich nachsehen oder den Report dort
zusammenklicken und die erzeugte API-Abfrage übernehmen.

## Zeitreihen

Zeit ist eine Property, keine Sonderfunktion: `date` in `columns` aufnehmen und nach
`date` sortieren. Für Wochen `date_week`, für Monate `date_month`.

## Grosse Auszüge

`max-results` ist pro Aufruf begrenzt. Für vollständige Auszüge über viele tausend Zeilen
ist die Data-API der falsche Weg — Piano bietet dafür einen eigenen Export-Pfad. Vor dem
Bau einer Paginierungsschleife über Zehntausende Zeilen prüfen, ob der Export das
günstigere Mittel ist.
