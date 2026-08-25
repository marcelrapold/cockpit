# Skill-Format

Verbindlich, weil `scripts/validate-skills.mjs` es prüft.

## Dateien

```
skills/<slug>/SKILL.md              Pflicht
skills/<slug>/references/*.md       optional, beliebig viele
```

Ordner mit führendem `_` (etwa `_template`) sind keine Skills: Sie erscheinen weder auf
der Website noch in `/api/skills`, werden aber trotzdem auf Lesbarkeit geprüft.

## Frontmatter

```yaml
---
name: adobe-analytics          # muss dem Ordnernamen entsprechen
description: Ein Satz …        # 40–400 Zeichen, einzeilig
status: review                 # draft | review | stable | deprecated
owner: ZVV Digital / Web-Analytics
tags: [analytics, adobe-analytics, reporting, api]
updated: 2026-08-25            # YYYY-MM-DD, letzte inhaltliche Prüfung
requires:                      # optional: Env-Variablen des ausführenden Agenten
  - ADOBE_CLIENT_ID
---
```

Der Parser versteht bewusst nur diesen Ausschnitt von YAML: flache Schlüssel, Strings,
Inline-Listen (`[a, b]`) und Block-Listen. Alles andere scheitert laut, statt still falsch
gelesen zu werden.

## Body

| Abschnitt | Status | Inhalt |
|-----------|--------|--------|
| `# Titel` | erwartet | Ein Satz zum Zweck |
| `## Wann dieser Skill greift` | Pflicht | Auslöser in der Sprache der Fragestellung, plus Abgrenzung zu anderen Skills |
| `## Voraussetzungen` | empfohlen | Tabelle: Was, woher, Pflicht ja/nein |
| `## Ablauf` | Pflicht | Nummerierte Schritte mit lauffähigen Beispielen |
| `## Fallstricke` | empfohlen | Bekannte Fehlerquellen |
| `## Ergebnisformat` | empfohlen | Wie das Resultat aussieht |
| `## Referenzen` | wenn vorhanden | Liste der `references/`-Dateien |

## Grenzen

| Regel | Wert | Bei Verstoss |
|-------|------|--------------|
| `description` | 40–400 Zeichen, einzeilig | Fehler |
| `SKILL.md` | > 12 kB | Warnung |
| `SKILL.md` | > 40 kB | Fehler |
| Referenz im Body genannt, Datei fehlt | — | Fehler |
| Referenzdatei vorhanden, im Body nicht genannt | — | Warnung |
| Key-artige Zeichenketten im Inhalt | — | Fehler |

## Verhältnis zu Anthropic Agent Skills

Das Format ist mit dem Agent-Skills-Format kompatibel: ein Ordner, eine `SKILL.md` mit
`name` und `description` im Frontmatter, ergänzendes Material daneben. `scripts/sync-skills.mjs`
kopiert die Ordner unverändert in ein `.claude/skills`-Verzeichnis. Die zusätzlichen Felder
(`status`, `owner`, `tags`, `updated`, `requires`) sind ZVV-Erweiterungen für Pflege und
Katalog; Agenten ignorieren sie folgenlos.
