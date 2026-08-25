---
name: _template
description: Vorlage für neue Skills — kopieren, umbenennen, Platzhalter ersetzen. Wird von der Registry ignoriert.
status: draft
owner: ZVV Digital
tags: [meta]
updated: 2026-08-25
requires: []
---

# <Skill-Titel>

Ein Satz, der den Zweck festhält: Welche wiederkehrende Frage oder Aufgabe erledigt dieser Ablauf?

## Wann dieser Skill greift

- Konkrete Auslöser, in der Sprache, in der die Aufgabe tatsächlich gestellt wird.
- Auch die Abgrenzung: Wann ist ein anderer Skill der richtige?

## Voraussetzungen

| Was | Woher | Pflicht |
|-----|-------|---------|
| `ENV_VARIABLE` | 1Password / Vercel-Projekt | ja |

## Ablauf

1. Nummerierte Schritte. Ein Schritt = eine Entscheidung oder ein Aufruf.
2. Bei API-Aufrufen: vollständiges, lauffähiges Beispiel — keine Prosa-Beschreibung eines Requests.
3. Zwischenergebnisse benennen, damit spätere Schritte sich darauf beziehen können.

## Fallstricke

- Alles, was schon einmal zu einer falschen Zahl geführt hat. Das ist der wertvollste Teil des Dokuments.

## Ergebnisformat

Wie das Resultat aussehen soll — Tabelle, Kennzahl, Fliesstext — und in welcher Einheit.

## Referenzen

- `references/<datei>.md` — wird erst geladen, wenn der Ablauf es verlangt.
