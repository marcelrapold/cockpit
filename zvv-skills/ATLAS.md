# Atlas-Konformität

Dieses Repo folgt dem [ZVV Atlas](https://atlas.zvv.dev), der Foundation für ZVV-Apps
(Brand, Auth, UI, Stack).

## Was verifiziert ist

Aus den Projekt-Metadaten des Atlas-Deployments (Vercel-Team `zvv`, Projekt `zvv-atlas`,
`prj_kbpKeL1Aji9YcxnQK2uL1HdWPKRJ`) gelesen und hier übernommen:

| Fakt | Atlas | Hier |
|------|-------|------|
| Framework | `nextjs` | Next.js 15, App Router |
| Node-Version | `24.x` | `24.x` in `.nvmrc` und `engines` |
| Deployment-Schutz | SSO an, `all_except_custom_domains` | dieselbe Einstellung vorgesehen, siehe `docs/bootstrap.md` |
| Domain-Muster | Custom-Domain plus `<projekt>-zvv.vercel.app` | `skills.zvv.dev` plus `zvv-skills-zvv.vercel.app` |

Der Deployment-Schutz beantwortet die Auth-Frage: Beim Atlas sind die
`*.vercel.app`-URLs hinter Vercel-SSO, die Custom-Domain ist öffentlich. Genau dieses
Muster übernimmt `zvv-skills` — Previews intern, `skills.zvv.dev` offen, damit Agenten die
Endpunkte ohne Anmeldung lesen können.

## Was offen bleibt

Der **Inhalt** der Spec ist ungelesen. Weder `atlas.zvv.dev` noch die
`*.vercel.app`-Deployment-URLs noch das Repo `zvvch/zvv-atlas` waren aus dieser
Arbeitsumgebung erreichbar (Egress-Allowlist bzw. Session-Scope). Brand und UI sind
deshalb abgeleitet, nicht übernommen.

| Säule | Umsetzung hier | Zu prüfen |
|-------|----------------|-----------|
| **Stack** | Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind 3.4, Node 24, Vercel-Team `zvv` | ob Atlas eine geteilte Config oder ein Basis-Paket vorschreibt; Versionsvorgaben für React/Tailwind |
| **Brand** | Farben und Schriften als CSS-Variablen in `app/globals.css` (`--zvv-blue`, `--zvv-ink`, …), Tailwind greift nur darauf zu | exakte Farbwerte, Hausschrift, Logo, Favicon, OG-Bild — derzeit Platzhalter |
| **UI** | eigene, minimale Komponenten (`components/`), keine fremde Bibliothek | ob Atlas eine Komponentenbibliothek oder eine Layout-Shell vorgibt |
| **Auth** | keine Anmeldung auf der Custom-Domain, SSO auf Preview-URLs | bestätigt durch das Atlas-Setup; nur zu prüfen, falls `skills.zvv.dev` doch nicht öffentlich sein soll |

## Angleichen

Der Aufwand ist klein gehalten:

- **Farben und Schrift**: ausschliesslich `app/globals.css`, Block `:root`. Keine
  Farbwerte in Komponenten.
- **Layout**: `app/layout.tsx` — Kopf, Fuss, Container.
- **Komponenten**: `components/`, zwei Dateien.
