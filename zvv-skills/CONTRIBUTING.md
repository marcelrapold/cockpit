# Beitragen

## Neuen Skill anlegen

```bash
cp -r skills/_template skills/<slug>
$EDITOR skills/<slug>/SKILL.md
npm run validate
```

`<slug>` in kebab-case, benannt nach der **Aufgabe**, nicht nach dem Werkzeug, sofern die
Aufgabe grösser ist als ein System (`web-reporting-weekly`, nicht `adobe-wochenreport`).
Der Ordnername und das Frontmatter-Feld `name` müssen übereinstimmen — die Prüfung
erzwingt das.

## Was einen guten Skill ausmacht

**Die Beschreibung ist das Wichtigste.** Ein Modell sieht zuerst nur `description` und
entscheidet daran, ob es diesen Skill lädt. Sie muss beantworten: Was kann der Skill, und
wann greift er? Nicht „Adobe-Analytics-Hilfe“, sondern „Beantwortet Fragen zu Visits,
Kampagnen und Conversions aus Adobe Analytics über die Reporting-API 2.0“.

**Vollständige Beispiele statt Beschreibungen.** Ein Request, den man kopieren und
absetzen kann, ist mehr wert als drei Absätze darüber, wie der Request aufgebaut wäre.

**Fallstricke sind der eigentliche Wert.** Die API-Dokumentation kennt das Modell
ungefähr. Was es nicht kennt: dass Adobes Enddatum exklusiv und Pianos inklusiv ist, dass
die Search Console drei Tage nachhinkt, dass Cloudflares Zahlen gestichprobt sind. Jeder
Fehler, der einmal zu einer falschen Zahl geführt hat, gehört in diesen Abschnitt.

**Kurz halten, Details auslagern.** `SKILL.md` beschreibt den Ablauf. Alles zum
Nachschlagen — Feldlisten, Fehlercodes, fertige Abfragen — kommt nach `references/` und
wird erst geladen, wenn der Ablauf es verlangt. Über 12 kB warnt die Prüfung, über 40 kB
scheitert sie.

**Keine Zugangsdaten.** Skills nennen Variablennamen, nie Werte. Die Prüfung sucht nach
typischen Key-Mustern und lässt den Build scheitern.

**Nichts erfinden.** Wenn ein Endpunkt, ein Grenzwert oder eine Feld-ID unsicher ist:
hinschreiben, dass sie zu prüfen ist, und wo. Eine erfundene Zahl in einem Skill wird zu
einer erfundenen Zahl in einem Report.

## Pflichtabschnitte

`## Wann dieser Skill greift` und `## Ablauf` sind Pflicht, `## Fallstricke` und
`## Ergebnisformat` dringend empfohlen. Das vollständige Format steht in
[docs/skill-format.md](./docs/skill-format.md).

## Pflegen

`updated` ist das Datum der letzten **inhaltlichen Prüfung**, nicht der letzten
Tippfehlerkorrektur. Ein Skill mit `status: stable` und einem Datum von vor einem Jahr
ist ein Versprechen, das niemand mehr überprüft hat — dann lieber auf `review` setzen.

Reifegrade: `draft` (im Aufbau) → `review` (in Erprobung) → `stable` (verlässlich) →
`deprecated` (abgelöst, bleibt zur Nachvollziehbarkeit stehen).

## Review

Ein Pull Request wird zusammengeführt, wenn `npm run validate` durchläuft und jemand aus
dem fachlich zuständigen Team den Ablauf einmal nachvollzogen hat. Bei Analytics-Skills
heisst das: die Abfrage tatsächlich absetzen und das Ergebnis gegen die jeweilige
Oberfläche halten.
