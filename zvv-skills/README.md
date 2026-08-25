# ZVV Skills

Wiederkehrende Geschäftsabläufe des ZVV, aufgeschrieben so, dass ein Mensch sie
nachvollziehen und ein Sprachmodell sie ausführen kann. Analytics-Abfragen,
Reporting-Routinen und Betriebschecks über Adobe Analytics, Piano Analytics, Google
Search Console und Cloudflare.

**Live:** [skills.zvv.dev](https://skills.zvv.dev)

Gebaut auf dem [ZVV Atlas](https://atlas.zvv.dev) — Abweichungen und offene Punkte
stehen in [ATLAS.md](./ATLAS.md).

---

## Warum

Das Wissen, wie eine Kennzahl wirklich zustande kommt, liegt sonst in Köpfen, Chats und
alten Confluence-Seiten. Eine falsch gesetzte Datumsgrenze oder eine übersehene
Stichprobe erzeugt eine Zahl, die plausibel aussieht und falsch ist. Dieses Repo hält
solche Abläufe an einer Stelle fest, versioniert sie über Pull Requests und liefert sie
in einer Form aus, die ein Agent direkt laden kann.

---

## Aufbau

```
skills/<slug>/SKILL.md          ← der Ablauf, Markdown mit Frontmatter
skills/<slug>/references/*.md   ← Details, die erst bei Bedarf geladen werden
skills/_template/SKILL.md       ← Vorlage für neue Skills

app/                            ← Next.js App Router: Website + maschinenlesbare Endpunkte
lib/                            ← Loader, Frontmatter-Parser, Typen
scripts/validate-skills.mjs     ← Formatprüfung, läuft in CI und vor jedem Build
scripts/sync-skills.mjs         ← Skills in ein lokales .claude/skills-Verzeichnis kopieren
```

Ein Skill ist eine Datei, kein Programm. Die Website liest `skills/` zur Build-Zeit —
es gibt keine Datenbank und keinen Redaktionsprozess ausserhalb von Git.

---

## Skills

| Skill | Zweck |
|-------|-------|
| `adobe-analytics` | Visits, Seitenaufrufe, Kampagnen und Conversions über die Reporting-API 2.0 |
| `piano-analytics` | Besuche, Quellen und Events über die Piano Data-API |
| `google-search-console` | Klicks, Impressionen, Positionen aus der Suche |
| `cloudflare-analytics` | Traffic, Statuscodes, Cache und Bots auf CDN-Ebene |
| `web-reporting-weekly` | Wochenreport, der die vier Quellen zusammenführt |

---

## Nutzung durch Agenten

| Endpunkt | Inhalt |
|----------|--------|
| `GET /llms.txt` | Katalog als Klartext, vollständig lesbar |
| `GET /api/skills` | Katalog als JSON, ohne Bodies |
| `GET /api/skills/<slug>` | ein Skill inklusive Body |
| `GET /s/<slug>/SKILL.md` | rohes Markdown, unverändert aus dem Repo |
| `GET /s/<slug>/references/<datei>.md` | Referenzdatei, roh |

Der übliche Weg: `/llms.txt` lesen, den passenden Skill wählen, dessen `SKILL.md` laden,
Referenzen erst nachladen, wenn der Ablauf sie nennt. Das hält den Kontext klein.

Lokal in ein Agent-Verzeichnis kopieren:

```bash
npm run sync                    # → ./.claude/skills
node scripts/sync-skills.mjs ~/.claude/skills
```

---

## Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
npm run validate   # Formatprüfung aller Skills
npm run build      # validiert und baut
```

Node 22. Die Site braucht keine Secrets — die Variablen in `.env.example` beschreiben,
was ein **ausführender** Agent benötigt, nicht die Website.

---

## Beitragen

Neuen Skill anlegen: `skills/_template/` kopieren, umbenennen, ausfüllen,
`npm run validate` laufen lassen, Pull Request. Das Format und die Regeln dahinter stehen
in [CONTRIBUTING.md](./CONTRIBUTING.md) und [docs/skill-format.md](./docs/skill-format.md).

---

## Sicherheit

- Keine Zugangsdaten im Repo. `validate-skills.mjs` sucht nach typischen Key-Mustern und lässt den Build scheitern.
- Die Skills nennen Umgebungsvariablen, nie deren Werte.
- Die ausgelieferte Site liest ausschliesslich Markdown aus `skills/`; der Roh-Endpunkt lässt keine Pfade ausserhalb dieses Verzeichnisses zu.
