---
name: web-reporting-weekly
description: Erstellt den wöchentlichen Web-Report des ZVV aus Adobe Analytics, Piano, Google Search Console und Cloudflare — feste Kennzahlen, fester Zeitraum, fester Aufbau, inklusive Plausibilitätsprüfung zwischen den Quellen.
status: draft
owner: ZVV Digital
tags: [reporting, analytics, workflow]
updated: 2026-08-25
requires: []
---

# Wöchentlicher Web-Report

Setzt die Einzelabfragen zu einem Bericht zusammen. Dieser Skill ruft selbst keine API
auf — er entscheidet, welche Skills in welcher Reihenfolge laufen und wie das Ergebnis
aussieht.

## Wann dieser Skill greift

- „Mach den Wochenreport“, „Wie war die letzte Woche?“, montags als geplanter Lauf.
- Immer dann, wenn mehrere Quellen zu **einer** Aussage zusammengeführt werden sollen.

## Zeitraum

Kalenderwoche, Montag bis Sonntag, abgeschlossen. Die laufende Woche wird nie berichtet.

Wegen des Datenverzugs der Search Console (zwei bis drei Tage) ist die Woche frühestens
am Mittwoch danach vollständig. Ein Lauf am Montag liefert unvollständige Suchdaten — in
dem Fall die Suchzahlen als vorläufig kennzeichnen oder den Lauf verschieben.

## Ablauf

1. **Zeitraum festlegen.** Start = Montag der Vorwoche, Ende = Sonntag. Beide Daten explizit
   ausschreiben und im Bericht nennen. Auf die unterschiedlichen Konventionen achten:
   Adobe erwartet ein exklusives Enddatum, Piano und die Search Console ein inklusives.

2. **Reichweite holen** — `adobe-analytics`: Visits und Seitenaufrufe der Woche, dazu
   dieselbe Woche des Vorjahres. Zusätzlich Top-10-Seiten und die Kanalverteilung.

3. **Gegenprobe** — `piano-analytics`: Besuche derselben Woche. Weicht der Wert um mehr als
   20 Prozent von Adobe ab, ist das ein Befund und keine Fussnote: erst der Ursache
   nachgehen (Consent, Tagging, Bot-Filter), bevor eine der beiden Zahlen berichtet wird.

4. **Sichtbarkeit holen** — `google-search-console`: Klicks, Impressionen, mittlere Position
   der Woche; Top-Gewinner und -Verlierer gegenüber der Vorwoche auf Seitenebene.

5. **Technik gegenprüfen** — `cloudflare-analytics`: Anfragevolumen, Anteil 5xx,
   Cache-Trefferquote. Nur berichten, wenn auffällig — sonst als eine Zeile „unauffällig“.

6. **Plausibilität prüfen**, bevor irgendetwas geschrieben wird:
   - Bewegen sich Adobe und Piano in dieselbe Richtung?
   - Erklärt ein Cloudflare-Ereignis einen Einbruch, den beide Analytics-Systeme zeigen?
   - Gab es Feiertage, Baustellen, Fahrplanwechsel oder Kampagnen in der Woche?
   Widersprüche gehören in den Bericht, nicht in den Papierkorb.

7. **Schreiben** nach dem Aufbau unten.

## Fallstricke

- **Kein Monatsvergleich.** Wochen gegen Wochen. Monate haben unterschiedlich viele Werktage.
- **Prozentangaben ohne Basiswert sind wertlos.** „+40 %“ bei 50 Visits ist Rauschen.
- **Feiertage schlagen härter durch als jede Kampagne.** Vor der Interpretation den Kalender ansehen.
- **Vier Quellen mit vier Sitzungsdefinitionen.** Zahlen aus verschiedenen Systemen nie addieren.

## Ergebnisformat

```markdown
# Web-Report KW <NN> (<Start> – <Ende>)

## Auf einen Blick
<Zwei bis drei Sätze. Was ist passiert, und warum.>

| Kennzahl | Woche | Vorwoche | Vorjahr |
|----------|-------|----------|---------|
| Visits (Adobe) | | | |
| Besuche (Piano) | | | |
| Klicks (Google) | | | |
| Impressionen (Google) | | | |
| Ø Position (Google) | | | |

## Auffälligkeiten
- <Befund, Beleg, Einordnung>

## Technik
<Eine Zeile, wenn unauffällig.>

## Datenstand
Adobe <RSID>, Zeitzone <TZ> · Piano Site <ID> · Search Console <Property>, dataState <…>
· Cloudflare Zone <…>. Erstellt am <Datum>.
```

Der Abschnitt „Datenstand“ ist nicht optional. Ohne ihn lässt sich eine Woche später nicht
mehr feststellen, worauf eine Zahl beruhte.
