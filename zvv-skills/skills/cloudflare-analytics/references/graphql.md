# Cloudflare GraphQL Analytics — Referenz

Endpunkt: `POST https://api.cloudflare.com/client/v4/graphql`,
Header `Authorization: Bearer <token>`.

## Schema erkunden statt raten

Die verfügbaren Felder hängen an Tarif und Produkten der Zone. Statt Feldnamen zu raten,
das Schema abfragen:

```graphql
query {
  __type(name: "Zone") {
    fields { name description }
  }
}
```

Für die Filter- und Dimensionsfelder eines Datensatzes analog
`__type(name: "ZoneHttpRequestsAdaptiveGroups")`.

## Grundgerüst

```graphql
query ZoneTraffic($zone: String!, $from: Time!, $to: Time!) {
  viewer {
    zones(filter: { zoneTag: $zone }) {
      httpRequestsAdaptiveGroups(
        limit: 1000
        filter: { datetime_geq: $from, datetime_lt: $to }
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { edgeResponseBytes }
        dimensions {
          edgeResponseStatus
          cacheStatus
          clientCountryName
          clientRequestHTTPHost
        }
      }
    }
  }
}
```

Account-weite Datensätze hängen unter `viewer { accounts(filter: { accountTag: … }) }`
statt unter `zones`.

## Filteroperatoren

Suffixe am Feldnamen: `_geq`, `_gt`, `_leq`, `_lt`, `_neq`, `_in`, `_like`.
Mehrere Bedingungen in einem Filterobjekt werden mit UND verknüpft; `OR:` und `AND:`
erlauben explizite Verschachtelung.

```graphql
filter: {
  datetime_geq: $from
  datetime_lt: $to
  edgeResponseStatus_geq: 500
  clientRequestHTTPHost: "www.zvv.ch"
}
```

## Zeitliche Auflösung

`datetimeHour` bzw. `datetimeMinute` als Dimension liefert die Zeitreihe:

```graphql
httpRequestsAdaptiveGroups(
  limit: 500
  filter: { datetime_geq: $from, datetime_lt: $to }
  orderBy: [datetimeHour_ASC]
) {
  count
  avg { sampleInterval }
  dimensions { datetimeHour }
}
```

## Fertige Abfragen

**Fehlerbild nach Statuscode**

```graphql
dimensions { edgeResponseStatus }
filter: { datetime_geq: $from, datetime_lt: $to, edgeResponseStatus_geq: 400 }
orderBy: [count_DESC]
```

**Cache-Trefferquote**

```graphql
dimensions { cacheStatus }
```

Trefferquote = Summe der `hit`-Zeilen geteilt durch die Summe aller Zeilen, jeweils nach
Hochrechnung mit `sampleInterval`.

**Blockierte Zugriffe**

```graphql
firewallEventsAdaptive(
  limit: 100
  filter: { datetime_geq: $from, datetime_lt: $to, action: "block" }
  orderBy: [datetime_DESC]
) {
  action
  clientCountryName
  clientRequestPath
  source
  ruleId
}
```

## Fehlerbehandlung

Antworten kommen mit HTTP 200, auch wenn die Abfrage scheitert:

```json
{ "data": null, "errors": [{ "message": "…", "path": ["viewer", "zones"] }] }
```

`errors` immer prüfen. Häufigste Ursachen: Token ohne Analytics-Leserecht, unbekanntes
Feld für diesen Tarif, Zeitraum ausserhalb der Rückhaltedauer.
