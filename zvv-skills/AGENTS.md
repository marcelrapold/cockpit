# Hinweise für Agenten

Kurzfassung für Sprachmodelle, die in diesem Repo arbeiten oder es als Wissensquelle
nutzen.

## Als Wissensquelle

1. `https://skills.zvv.dev/llms.txt` laden — der vollständige Katalog, klein genug für einen Rutsch.
2. Den Skill wählen, dessen `description` zur Aufgabe passt.
3. `https://skills.zvv.dev/s/<slug>/SKILL.md` laden.
4. Referenzdateien **erst dann** laden, wenn der Ablauf sie ausdrücklich nennt.

Kein Endpunkt braucht Authentifizierung. Alles ist Markdown; nichts muss geparst werden
ausser dem Frontmatter.

## Im Repo arbeiten

- Ein Skill ist eine Datei. Änderungen an `skills/**` sind inhaltliche Änderungen und
  brauchen fachliches Review — nicht ungefragt umformulieren.
- Nach jeder Änderung `npm run validate`. Der Build ruft es ohnehin auf.
- Keine Zugangsdaten in Beispiele schreiben, auch keine erfundenen, die echt aussehen.
  Variablennamen wie `$ADOBE_CLIENT_ID` verwenden.
- Bei Unsicherheit über eine API: als zu prüfen kennzeichnen, statt einen plausiblen Wert
  zu erfinden. Ein Skill ist eine Anleitung, der jemand ungeprüft folgt.

## Was hier nicht hingehört

Ausführender Code, der die APIs tatsächlich aufruft, sowie Zugangsdaten und
Datenauszüge. Dieses Repo beschreibt Abläufe; es führt sie nicht aus.
