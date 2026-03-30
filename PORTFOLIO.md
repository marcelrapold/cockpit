# Workload- und Delivery-Portfolio

**Marcel Rapold, ICT-Entwicklung, Zürcher Verkehrsverbund (ZVV)**

| Eigenschaft | Wert |
|---|---|
| Erstellt | 30. März 2026 |
| Methodik | Repository-Analyse (GitHub API, lokale Git-Historie) |
| Perimeter | 30 Repositories, GitHub-Organisation `zvvch` |
| Datenstand | 30.03.2026, >1'900 Commits ausgewertet |
| Verfasser | Automatisiert generiert auf Basis von Code-Evidenz |

> **Hinweis zur Methodik:** Dieses Dokument basiert ausschliesslich auf der Analyse von Repository-Daten (Commits, READMEs, Konfigurationsdateien, Deployment-Artefakte, Contributor-Daten). Es standen keine Zeiterfassungsdaten, Projektpläne oder Interviews zur Verfügung. Aufwandschätzungen sind konservative Inferenzen und als solche gekennzeichnet.

---

## 1. Executive Summary

Marcel Rapold verantwortet als **einziger Entwickler** der ZVV-ICT ein Portfolio, das in Umfang und Breite einer kleinen Entwicklungsabteilung entspricht. Die Repository-Analyse belegt:

- **7 aktive Change-Initiativen**, darunter eine öffentliche Ausschreibung (AEM), eine strategische Datenplattform-Spezifikation (NOVA Kundenspiegel) und eine produktive Kampagnenplattform mit über 100 Releases (ZVV Mailer)
- **7 produktive Services im Dauerbetrieb**, die teils geschäftskritische Prozesse unterstützen (Ticket-Kontrolle, Budget-Monitoring, Schul-Anmeldungen, Medienspiegel)
- **8 weitere Tools und Plattform-Komponenten**, die gewartet und betrieben werden
- **4 Governance- und Koordinationsaufgaben**, die in keinem Projektplan sichtbar sind

Die konservative Hochrechnung ergibt einen **Jahresaufwand von 280–340 Personentagen (PT)** bei einer verfügbaren Kapazität von **~220 PT** (1 FTE). Das entspricht einer Auslastung von **127–155%**.

**Zentrales Risiko:** Marcel ist in 27 von 30 Repos der **einzige menschliche Contributor**. Die Accounts `AEON-99` und `zvv-hf` sind AI-Agenten unter seiner Steuerung. Drei weitere Personen tragen punktuell zu je einem einzelnen Repo bei — ohne breite Portfolio-Abdeckung. Bei Ausfall der zentralen Person steht das Gesamtportfolio ohne Wissensträger, Stellvertretung oder Übergabemöglichkeit faktisch still.

**Bewertung:** Der produktive Einsatz von AI-Coding-Agenten als Multiplikator ist bemerkenswert und ermöglicht erst den aktuellen Output. Er ersetzt jedoch keine menschliche Stellvertretung und kaschiert ein strukturelles Kapazitäts- und Risikoproblem.

---

## 2. Portfolio-Übersichtstabelle

### Legende

- **Modus:** Build = aktive Neuentwicklung | Run = Dauerbetrieb | Improve = Weiterentwicklung bestehender Systeme | Govern = Spezifikation, Architektur, Beschaffung
- **Kritikalität:** Hoch = Ausfall hat direkte geschäftliche Auswirkung | Mittel = wichtig, aber nicht unmittelbar geschäftskritisch | Niedrig = unterstützend
- **Confidence:** Hoch = durch Commit-Daten und Produktions-Evidenz belegt | Mittel = plausible Inferenz aus Repo-Analyse | Niedrig = Annahme auf Basis typischer Muster
- **PT = Personentage pro Jahr** (konservative Schätzung)

### 2.1 Change-Initiativen

| Initiative | Zweck | Rolle | Arbeitsart | Modus | Kritikalität | PT/Jahr | Confidence |
|---|---|---|---|---|---|---|---|
| **ZVV Mailer** | Interne E-Mail-Kampagnen- und Newsletter-Plattform (`mailer.zvv.ch`) | Architekt, Entwickler, Betreiber | Fullstack-Entwicklung, Auth/RBAC, API-Design, E-Mail-Rendering, CI/CD, Release-Management | Build / Improve | Hoch | 50–60 | Hoch |
| **ZVV TAMA** | Vernehmlassungs-Dashboard Tarifmassnahmen 2026 (`tama.zvv.ch`) | Alleinentwickler | Fullstack, Karten/Geo, Typeform-Integration, Cron-Sync, Mailer-API | Build | Hoch | 25–30 | Hoch |
| **AEM-Ausschreibung 2026** | Öffentliche Vergabe Betrieb/Weiterentwicklung zvv.ch (AEMaaCS) | Fachverantwortlicher, Autor, CI-Engineer | Pflichtenheft-Erstellung, Dokumenten-Pipeline (Markdown→DOCX/PDF), Release-Automatisierung | Build / Govern | Hoch | 20–25 | Hoch |
| **NOVA Kundenspiegel** | Customer Data Mirror ausserhalb NOVA (Golden Record) | Architekt, Spezifikation, RFP-Autor | Engineering Blueprint, Architektur-Entscheide, Ausschreibungsvorbereitung | Govern | Hoch | 10–15 | Mittel |
| **Fahrzeugdatenbank 2.0** | Ablösung MS Access FZDB → Web-App (Spezifikation) | Architekt, Spezifikation | Technische Spezifikation, Make-or-Buy-Entscheidungsgrundlage | Govern | Mittel | 5–8 | Mittel |
| **ZVV Kundenkonto** | UI-Prototyp für Kundenkonto-Relaunch (SwissPass, Abos) | Prototyping, UX-Konzeption | Frontend-Prototyp, Dienstleister-Briefing | Build | Mittel | 8–12 | Mittel |
| **ZVV Info / Fahrplan** | AI-gestützter Fahrplan-Informationsdienst (MCP/GTFS) | Entwickler, Exploration | AI SDK-Integration, GTFS-Datenanbindung, Proof of Concept | Build / Explore | Niedrig | 8–10 | Niedrig |

**Subtotal Change: 126–160 PT**

### 2.2 Run / Operative Verantwortlichkeiten

| Service | Zweck | Rolle | Arbeitsart | Modus | Kritikalität | PT/Jahr | Confidence |
|---|---|---|---|---|---|---|---|
| **ZVV Entdeckungsreise** | Ticketcode-Validierung und Schul-Anmeldungssystem (`entdeckungsreise.zvv.ch`) | Alleinbetreiber | Bugfixes, Admin-Support, E-Mail-Monitoring, Export-Anpassungen, Security-Updates | Run | Hoch | 10–15 | Hoch |
| **ZVV Kontrollapp** | PWA für Billett-Kontrolle und Zeiterfassung (`kontrolle.zvv.ch`) | Alleinbetreiber | Wartung, Dependency-Updates, Daten-Export | Run | Hoch | 5–8 | Hoch |
| **ZVV KontoRadar** | Echtzeit-Dashboard für Objektkredit-/Budget-Management (`kontoradar.zvv.dev`) | Alleinentwickler/-betreiber | Datenmodell-Pflege, UI-Verbesserungen, Supabase-Betrieb | Run / Improve | Mittel | 8–12 | Mittel |
| **ZVV Medienspiegel** | Automatisierte Medienbeobachtung mit AI-Analyse (`medienspiegel.zvv.dev`) | Architekt, Betreiber | n8n-Workflow-Pflege, GPT-4o-Prompt-Tuning, PDF-Pipeline, E-Mail-Versand, Archiv | Run | Mittel | 15–20 | Mittel |
| **ZVV PDF2Text** | Self-hosted PDF-Extraktions-API (`pdf2text.rapold.io`) | Betreiber | Hosting, API-Stabilität, Upstream-Sync | Run | Mittel | 3–5 | Hoch |
| **ZVV App Modal** | Feature-Showcase der ZVV-App auf zvv.ch (`appmodal.zvv.ch`) | Entwickler, AEM-Integrator | AEM-Clientlib-Builds, Security-Patches, Content-Updates | Run / Improve | Mittel | 5–8 | Mittel |
| **ZVV App Banner** | Mobile-App-Promotion Micro-Frontend auf zvv.ch (`appbanner.zvv.ch`) | Entwickler | UTM-Tracking, Store-Links, Rollback-Fähigkeit | Run | Niedrig | 3–5 | Hoch |

**Subtotal Run: 49–73 PT**

### 2.3 Produkt- / Plattform-Stewardship

| Komponente | Zweck | Arbeitsart | Modus | PT/Jahr | Confidence |
|---|---|---|---|---|---|
| **MCP-GTFS** | MCP Server für Schweizer ÖV-Fahrplandaten | Daten-Updates, API-Wartung | Run | 3–5 | Niedrig |
| **ZVV Lottie** | 34 Header-Animationen für zvv.ch | Asset-Pflege, Player-Wartung | Run | 2–3 | Hoch |
| **ZVV Statuspage** | Statusseite für ZVV-Dienste | Konfiguration, Deployment | Run | 2–3 | Niedrig |
| **ZVV FundPilot** | Fundbüro-Informationssystem (offlinefähig) | Daten-Aktualisierung | Run | 1–2 | Niedrig |
| **ZVV Testimonials** | Employer-Branding-Slider für HR | Content-Updates | Run | 1–2 | Niedrig |
| **ZVV VS Code Theme** | Developer-Experience-Tooling | Gelegentliche Pflege | Run | 1–2 | Hoch |
| **iCal Confluence Renderer** | On-Call-Kalender-Embed für Confluence | Wartung, ICS-Feed-Pflege | Run | 2–3 | Mittel |
| **n8n Workflows / MCP** | Workflow-Repository, Automatisierungen | Workflow-Wartung, Monitoring | Run | 5–8 | Mittel |

**Subtotal Stewardship: 17–28 PT**

### 2.4 Governance / Koordination / Stakeholder-Arbeit

| Aufgabe | Zweck | Arbeitsart | Modus | PT/Jahr | Confidence |
|---|---|---|---|---|---|
| **Jahreshochrechnung** | R-Skripte für HOP-Datenlieferungen / MVU-Linienabgrenzung | Datenaufbereitung, SQL, Parquet-Export | Govern | 5–8 | Mittel |
| **Kreditorenworkflow** | Budget-/Finanz-Tooling | Dashboard-Wartung | Run / Govern | 3–5 | Niedrig |
| **Security & CVE-Management** | Dependency-Updates und Security-Patches über alle Repos | Monitoring, Patching, Testing, Deployment | Govern | 10–15 | Mittel |
| **GitHub-Org-Management** | Organisation, CI/CD, Secrets, Profil | DevOps, Governance | Govern | 3–5 | Niedrig |
| **Stakeholder-Koordination** | Abstimmung mit Fachbereichen, Dienstleistern, Management | Meetings, Konzepte, Reviews | Govern | 15–20 | Niedrig |
| **AI-Tooling & Agenten-Steuerung** | Steuerung der AI-Coding-Agenten als Produktivitätshebel | Prompt Engineering, Review, Qualitätssicherung | Govern | 10–15 | Niedrig |

**Subtotal Governance: 46–68 PT**

---

## 3. Workload-Modell

### 3.1 Übersicht nach Arbeitstyp

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKLOAD-MODELL Marcel Rapold                       │
├──────────────────────────────┬──────────────────────────────────────────────┤
│                              │                                              │
│   CHANGE-INITIATIVEN         │   RUN / OPERATIVE VERANTWORTLICHKEITEN       │
│   126–160 PT (39–49%)        │   49–73 PT (15–22%)                          │
│                              │                                              │
│   ● ZVV Mailer        50-60  │   ● Entdeckungsreise            10-15        │
│   ● ZVV TAMA          25-30  │   ● Kontrollapp                  5-8         │
│   ● AEM-Ausschreibung 20-25  │   ● KontoRadar                   8-12        │
│   ● NOVA Kundenspiegel10-15  │   ● Medienspiegel               15-20        │
│   ● FZDB Spec          5-8   │   ● PDF2Text                     3-5         │
│   ● Kundenkonto        8-12  │   ● App Modal                    5-8         │
│   ● ZVV Info/Fahrplan  8-10  │   ● App Banner                   3-5         │
│                              │                                              │
├──────────────────────────────┼──────────────────────────────────────────────┤
│                              │                                              │
│   PLATTFORM-STEWARDSHIP      │   GOVERNANCE / KOORDINATION                  │
│   17–28 PT (5–9%)            │   46–68 PT (14–21%)                          │
│                              │                                              │
│   ● n8n Workflows      5-8   │   ● Stakeholder-Koordination    15-20        │
│   ● MCP-GTFS           3-5   │   ● Security/CVE-Management     10-15        │
│   ● Lottie Animationen 2-3   │   ● AI-Agenten-Steuerung        10-15        │
│   ● Statuspage         2-3   │   ● Jahreshochrechnung            5-8        │
│   ● iCal Confluence    2-3   │   ● GitHub-Org-Management         3-5        │
│   ● FundPilot          1-2   │   ● Kreditorenworkflow             3-5       │
│   ● Testimonials       1-2   │                                              │
│   ● VS Code Theme      1-2   │                                              │
│                              │                                              │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

### 3.2 Rollenverteilung (eine Person, alle Rollen)

| Rolle | Beschreibung | Betroffene Initiativen |
|---|---|---|
| **Softwarearchitekt** | Systemdesign, Technologieentscheide, Integrationsarchitektur | Mailer, NOVA Kundenspiegel, FZDB, Medienspiegel, KontoRadar |
| **Fullstack-Entwickler** | Frontend, Backend, API-Design, Datenmodelle | Mailer, TAMA, Entdeckungsreise, Kontrollapp, KontoRadar, Kundenkonto, App Modal |
| **DevOps / Platform Engineer** | CI/CD, Vercel, Supabase, Docker, n8n, Security-Patching | Alle produktiven Services |
| **Betriebsverantwortlicher** | Monitoring, Incident Response, Daten-Exporte, E-Mail-Delivery | Mailer, Medienspiegel, Entdeckungsreise, Kontrollapp, PDF2Text |
| **Beschaffungsspezialist** | Pflichtenheft-Erstellung, Vergabeverfahren, SIMAP-Publikation | AEM-Ausschreibung, NOVA Kundenspiegel |
| **Fachlicher Koordinator** | Stakeholder-Abstimmung, Anforderungsklärung, Dienstleister-Steuerung | AEM, NOVA, FZDB, Kundenkonto, TAMA |
| **Data Engineer** | R-Skripte, SQL, Parquet, Datenlieferungen | Jahreshochrechnung, KontoRadar |
| **AI Engineer** | AI-Agenten-Orchestrierung, Prompt Engineering, MCP-Entwicklung | ZVV Info, MCP-GTFS, Medienspiegel (GPT-4o), alle Repos (AI-Agenten) |

---

## 4. Annual Effort Forecast 2026

### 4.1 Kapazitätsbilanz

| Kategorie | Min (PT) | Max (PT) | Mittelwert (PT) |
|---|---|---|---|
| Change-Initiativen | 126 | 160 | 143 |
| Run / operativer Betrieb | 49 | 73 | 61 |
| Plattform-Stewardship | 17 | 28 | 23 |
| Governance / Koordination | 46 | 68 | 57 |
| **Gesamt geschätzt** | **238** | **329** | **284** |
| **Verfügbare Kapazität (1 FTE)** | | | **~220** |
| **Delta** | **−18** | **−109** | **−64** |

### 4.2 Interpretation

- **Best Case** (238 PT, Auslastung 108%): Nur erreichbar, wenn mehrere Initiativen planmässig abgeschlossen werden und keine ungeplanten Aufwände entstehen.
- **Expected Case** (284 PT, Auslastung 129%): Realistisches Szenario unter Berücksichtigung typischer Nebenaufwände. Erfordert konsequente Priorisierung und AI-Agenten-Einsatz als Multiplikator.
- **Worst Case** (329 PT, Auslastung 150%): Bei parallelen Eskalationen (z.B. AEM-Ausschreibungs-Fragen + Security-Incident + Medienspiegel-Pipeline-Ausfall) schnell erreichbar.

### 4.3 Saisonale Lastverteilung (Annahme)

| Quartal | Erwartete Schwerpunkte | Lastfaktor |
|---|---|---|
| Q1 2026 | AEM-Ausschreibung (Deadline), Mailer-Releases, TAMA-Build | Sehr hoch |
| Q2 2026 | NOVA-RFP, Entdeckungsreise (Saison), FZDB-Entscheidung | Hoch |
| Q3 2026 | AEM-Vergabeentscheid, Kundenkonto-Prototyp, Run-Betrieb | Mittel–Hoch |
| Q4 2026 | Jahreshochrechnung, TAMA-Vernehmlassung, Mailer-Verbesserungen | Hoch |

### 4.4 Nicht eingerechnete Aufwände

Folgende Aufwände sind in den Schätzungen **nicht enthalten**, fallen aber erfahrungsgemäss an:

- Ungeplante Incidents und Hotfixes
- Onboarding und Briefing externer Dienstleister
- Interne Schulungen und Wissenstransfer (sofern künftig aufgebaut)
- Evaluationen neuer Technologien und Proof-of-Concepts ausserhalb der gelisteten Initiativen
- Administrative Aufwände (Zeiterfassung, Rapportierung, Team-Meetings)

---

## 5. Management-relevante Beobachtungen

### 5.1 Absolutes Single-Point-of-Failure-Risiko

**Befund:** Marcel Rapold ist der primäre und in 27 von 30 Repos einzige menschliche Entwickler. Die Accounts `AEON-99` und `zvv-hf` sind AI-Coding-Agenten unter seiner Steuerung. Drei weitere Personen (`ALONELY19XX`, `frankhofmann`, `jannik868`) tragen punktuell zu je einem einzelnen Repo bei — ohne Breitenwirkung oder Stellvertretungsfunktion.

**Konsequenz:** Bei Ausfall der zentralen Person gibt es:
- Keinen breiten zweiten Wissensträger (die drei punktuell Beteiligten decken je nur ein Repo ab)
- Keine dokumentierte Übergabemöglichkeit für das Gesamtportfolio
- Keine Stellvertretungsregelung
- Keinen menschlichen Backup für die Mehrheit der 20+ produktiven Systeme

**Bewertung:** Dieses Risiko ist nicht graduell, sondern binär. Es betrifft nicht einzelne Projekte, sondern das gesamte digitale Serviceportfolio der ZVV-ICT-Eigenentwicklungen.

### 5.2 Versteckte operative Last

Mehrere Aufwandtreiber sind in klassischen Projektplänen und Portfolioberichten unsichtbar:

| Versteckter Aufwand | Evidenz | Geschätzte Last |
|---|---|---|
| **Security-Patching** | Commits zu CVE-2025-55182 (React RSC), CVE-2025-55184 (Next.js DoS), Dependency-Updates über >15 Repos | 10–15 PT/Jahr |
| **n8n-Pipeline-Betrieb** | Medienspiegel-Workflow mit 6+ externen Services (OpenAI, Google CSE, Resend, Supabase, PDF2Text, Jina AI) | 8–12 PT/Jahr |
| **AI-Agenten-Steuerung** | Konfiguration, Review und Qualitätssicherung der AI-generierten Code-Beiträge | 10–15 PT/Jahr |
| **Supabase-Administration** | Mindestens 5 produktive Supabase-Projekte (Mailer, TAMA, Entdeckungsreise, KontoRadar, Medienspiegel) | 5–8 PT/Jahr |
| **Vercel-Deployment-Management** | 10+ Vercel-Deployments mit eigenen Domains, Environment-Variablen, Edge-Config | 3–5 PT/Jahr |

### 5.3 Rollenüberladung

Eine einzelne Person deckt mindestens **8 unterscheidbare Rollen** ab (vgl. Abschnitt 3.2). In einer typischen IT-Organisation wären diese auf 3–5 Personen verteilt:

- Softwarearchitekt und Fullstack-Entwickler (normalerweise getrennt ab einer gewissen Portfoliogrösse)
- DevOps/Platform Engineer (eigene Disziplin)
- Betriebsverantwortlicher (eigene Disziplin, idealerweise getrennt von Entwicklung)
- Beschaffungsspezialist (fachlich-juristische Kompetenz)
- Fachlicher Koordinator / Product Owner (Stakeholder-facing)
- Data Engineer (spezialisierte Datenarbeit)
- AI Engineer (aufkommende Disziplin)

Diese Bündelung ermöglicht zwar schnelle Entscheidungen und kurze Wege, ist aber langfristig nicht tragfähig und stellt ein organisatorisches Risiko dar.

### 5.4 Strategische Relevanz vs. verfügbare Kapazität

Zwei der laufenden Initiativen haben **hohe strategische Relevanz** für den ZVV:

1. **AEM-Ausschreibung 2026**: Vergabe des Betriebs und der Weiterentwicklung von zvv.ch — der zentralen Kundenplattform. Fehler in der Ausschreibung oder mangelnde fachliche Tiefe haben direkte finanzielle und operative Konsequenzen.

2. **NOVA Kundenspiegel**: Strategische Datenplattform-Initiative mit Auswirkungen auf CRM, Marketing und Analytics. Die Spezifikation definiert die Datenarchitektur für die nächsten Jahre.

Beide Initiativen laufen **parallel zu 15+ operativen Services**, die laufende Aufmerksamkeit erfordern. Das Risiko, dass strategische Arbeit zugunsten operativer Dringlichkeit vernachlässigt wird, ist erheblich.

### 5.5 AI-Agenten als Produktivitätshebel — Chancen und Grenzen

**Befund:** Marcel setzt AI-Coding-Agenten systematisch als "virtuelle Teammitglieder" ein. Dies ist in der Schweizer ÖV-Branche ungewöhnlich fortschrittlich und erklärt den für eine Einzelperson bemerkenswert hohen Output (>1'900 Commits, 20+ Deliverables).

**Chancen:**
- Signifikante Produktivitätssteigerung bei Routine-Entwicklung und Dokumentation
- Ermöglicht Parallelisierung von Aufgaben, die sonst sequentiell ablaufen müssten
- Reduziert die "Time to First Commit" bei neuen Initiativen

**Grenzen:**
- AI-Agenten ersetzen keine menschliche Stellvertretung (kein Kontextwissen bei Ausfall)
- Qualitätssicherung und Review bleiben beim Menschen — der Bottleneck verschiebt sich
- Regulatorische und Compliance-Fragen zum AI-Einsatz in der öffentlichen Verwaltung sind ungeklärt
- Kein Wissenstransfer auf andere Personen — die AI-Agenten "wissen" nichts ohne Steuerung

### 5.6 Empfohlene Massnahmen (Kurzfassung)

| Priorität | Massnahme | Zeithorizont |
|---|---|---|
| 1 | **Stellvertretungsregelung** definieren — mindestens dokumentierte Notfallprozeduren für geschäftskritische Services | Sofort |
| 2 | **Priorisierungsmatrix** mit Auftraggeber abstimmen — nicht alles kann parallel mit gleicher Intensität laufen | Q2 2026 |
| 3 | **Zweite Entwicklungsressource** evaluieren — intern oder extern, mindestens für Run-Betrieb | Q2–Q3 2026 |
| 4 | **Dokumentationslage** systematisieren — Runbooks existieren für den Mailer, fehlen für die meisten anderen Services | Laufend |
| 5 | **Operative Services konsolidieren** — Prüfung, ob einzelne Tools zusammengelegt oder eingestellt werden können | Q3 2026 |

---

## 6. Anhang: Repository-Inventar

### Vollständige Repo-Liste (Stand 30.03.2026)

| Repository | Commits | Sprache | Erstellt | Letzter Push | Status |
|---|---|---|---|---|---|
| `zvv-mailer` | 739 | TypeScript | Dez 2025 | 30.03.2026 | Aktiv, Produktion |
| `zvv-entdeckungsreise` | 395 | TypeScript | Apr 2025 | 14.01.2026 | Produktion (Run) |
| `zvv-aemcs-ausschreibung-2026` | 167 | Python | Jan 2026 | 20.01.2026 | Archiviert (Vorgänger) |
| `zvv-aemcs-oeffentliche-ausschreibung-2026` | 34 | Python | Jan 2026 | 11.03.2026 | Aktiv |
| `zvv-kontrollapp` | 180 | JavaScript | Nov 2024 | 27.03.2026 | Produktion (Run) |
| `zvv-tama` | 134 | TypeScript | Mai 2025 | 26.03.2026 | Aktiv, Produktion |
| `zvv-app-modal` | 133 | TypeScript | Jun 2025 | 27.01.2026 | Produktion (Run) |
| `zvv-kontoradar` | 13 | TypeScript | Okt 2025 | 13.02.2026 | Produktion |
| `zvv-kontoradar` (Fork) | 29 | TypeScript | Okt 2025 | 13.02.2026 | Improve |
| `zvv-app-banner` | 30 | TypeScript | Okt 2025 | 19.11.2025 | Produktion (Run) |
| `zvv-kundenkonto` | 25 | TypeScript | Nov 2025 | 13.02.2026 | Prototyp |
| `zvv-fahrplan` / `zvv-info` | 19 | TypeScript | Feb 2026 | 12.02.2026 | Exploration |
| `zvv-novakundenspiegel` | 13 | Markdown | Aug 2025 | 03.12.2025 | Spezifikation |
| `zvv-medienspiegel` | 7 | HTML/n8n | Dez 2025 | 11.12.2025 | Produktion (Pipeline) |
| `zvv-kreditorenworkflow-dashboard` | 7 | TypeScript | Okt 2025 | Okt 2025 | Produktion |
| `zvv-jahreshochrechnung-2025` | — | R | Mär 2026 | 23.03.2026 | Aktiv (saisonal) |
| `ical-renderer-for-confluence` | — | JavaScript | Mär 2026 | 20.03.2026 | Produktion |
| `zvv-fzdb-spec` | — | HTML | Feb 2026 | 09.02.2026 | Spezifikation |
| `zvv-lottie` | 6 | JavaScript | Okt 2025 | 22.10.2025 | Produktion (Assets) |
| `zvv-vscode-theme` | 5 | TypeScript | Jan 2026 | 03.02.2026 | Tooling |
| `zvv-statuspage` | — | CSS | Dez 2025 | 12.12.2025 | Produktion |
| `zvv-fund-pilot` | — | TypeScript | Mai 2025 | 12.12.2025 | Produktion |
| `zvv-testimonials` | — | TypeScript | Mai 2025 | 12.12.2025 | Prototyp |
| `zvv-customer-radar` | — | TypeScript | Jul 2025 | 12.12.2025 | Prototyp |
| `zvv-kundenradar` | — | TypeScript | Okt 2025 | 12.12.2025 | Prototyp |
| `zvv-pdf2text` | 3 | Python | Dez 2025 | 11.12.2025 | Produktion (Service) |
| `mcp-gtfs` | — | HTML | Mai 2025 | 11.02.2026 | Aktiv |
| `zvv-n8n-flows` | — | — | Okt 2025 | Okt 2025 | Leer |
| `zvv-ai-crawl` | — | — | Aug 2025 | Aug 2025 | Archiviert |
| `.github` | — | — | Apr 2025 | 15.01.2026 | Org-Profil |

### Technologie-Footprint

| Technologie | Einsatzbereich | Anzahl Repos |
|---|---|---|
| **Next.js** (14–16) | Primäres Web-Framework | 10+ |
| **TypeScript** | Hauptsprache | 15+ |
| **Supabase** | Backend-as-a-Service (Auth, DB, Storage) | 5+ |
| **Vercel** | Hosting und Deployment | 10+ |
| **Resend** | Transaktions- und Kampagnen-E-Mails | 3+ |
| **n8n** | Workflow-Automatisierung | 2 |
| **OpenAI / GPT-4o** | AI-gestützte Textanalyse | 2 |
| **Python / FastAPI** | Microservices, Dokumenten-Pipeline | 3 |
| **R** | Statistische Datenaufbereitung | 1 |
| **AEM / AEMaaCS** | CMS-Integration (zvv.ch) | 2 |

### Contributor-Analyse

| GitHub-Account | Typ | Repos aktiv |
|---|---|---|
| `muraschal` (Marcel Rapold) | **Mensch — primärer Entwickler und Verantwortlicher** | Alle 30 |
| `AEON-99` | AI-Agent | zvv-kontrollapp, zvv-mailer, zvv-fahrplan |
| `zvv-hf` | AI-Agent | zvv-tama, zvv-kontoradar, zvv-kundenkonto, zvv-info |
| `ALONELY19XX` | Mensch (punktuell) | zvv-app-modal |
| `frankhofmann` | Mensch (punktuell) | ical-renderer-for-confluence |
| `jannik868` | Mensch (punktuell) | zvv-jahreshochrechnung-2025 |
| `dependabot[bot]` | Automatisierung | zvv-kontrollapp |
| `github-actions[bot]` | CI/CD | zvv-mailer |

---

*Dieses Dokument wurde am 30. März 2026 automatisiert auf Basis einer Repository-Analyse erstellt. Es ersetzt keine formelle Kapazitätsplanung, sondern dient als datengestützte Entscheidungsgrundlage für das Management.*
