# Atlas-Konformität

Dieses Repo folgt dem [ZVV Atlas](https://atlas.zvv.dev), der Foundation für ZVV-Apps
(Brand, Auth, UI, Stack).

## Offener Punkt

Die Angleichung ist **nicht verifiziert**. Zum Zeitpunkt des Aufbaus war weder
`atlas.zvv.dev` noch `zvvch/zvv-atlas` aus der Arbeitsumgebung erreichbar. Der Stack
wurde deshalb aus bestehenden ZVV-Projekten abgeleitet, nicht aus der Spec gelesen.

Vor dem ersten Produktiv-Deployment ist die Tabelle unten gegen den Atlas zu prüfen.

## Stand je Säule

| Säule | Umsetzung hier | Zu prüfen |
|-------|----------------|-----------|
| **Stack** | Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind 3.4, Node 22, Deployment auf Vercel im Team `zvv` | Versionsvorgaben, ob Atlas eine geteilte Config oder ein Basis-Paket vorschreibt |
| **Brand** | Alle Farben und Schriften als CSS-Variablen in `app/globals.css` (`--zvv-blue`, `--zvv-ink`, …), Tailwind greift nur darauf zu | Exakte Farbwerte, Hausschrift, Logo, Favicon, OG-Bild — derzeit Platzhalter |
| **UI** | Eigene, minimale Komponenten (`components/`), keine fremde Komponentenbibliothek | Ob Atlas eine Komponentenbibliothek oder ein Layout-Shell vorgibt, das hier zu übernehmen ist |
| **Auth** | Keine. Der Inhalt ist öffentlich lesbar; Änderungen laufen ausschliesslich über GitHub | Ob `skills.zvv.dev` öffentlich sein darf oder hinter dem Atlas-Auth-Mechanismus liegen muss |

## Angleichen

Der Aufwand ist klein gehalten:

- **Farben und Schrift**: ausschliesslich `app/globals.css`, Block `:root`. Keine
  Farbwerte in Komponenten.
- **Layout**: `app/layout.tsx` — Kopf, Fuss, Container.
- **Komponenten**: `components/`, zwei Dateien.
- **Auth**: Falls nötig, greift der Atlas-Mechanismus in `middleware.ts` (noch nicht
  vorhanden) und lässt die Endpunkte `/llms.txt`, `/api/skills*` und `/s/*` entweder
  offen oder mit Token — die Entscheidung gehört in dieses Dokument, sobald sie fällt.
