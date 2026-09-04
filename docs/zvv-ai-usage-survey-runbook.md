# Runbook: ZVV-Umfrage «Aktive Nutzung von KI-Tools»

**Ziel des Runbooks:** Eine Person kann diesen Case von der Idee bis zum Management-Deck
durchziehen, ohne selbst Methodik erfinden zu müssen. Enthält: Designentscheide inkl.
Begründung, vollständiger Fragekatalog, MS-Forms-Umsetzung, Kommunikationsplan für
maximalen Rücklauf, Auswertungslogik und Storyline des Slide Decks.

| | |
|---|---|
| **Auftraggeber** | ZVV-Geschäftsleitung (Sponsor) |
| **Durchführung** | 1 Lead + 1 Co-Auswertung (4-Augen bei Freitexten) |
| **Grundgesamtheit** | Mitarbeitende ZVV-Geschäftsstelle, ca. 40 Personen (Vollerhebung) |
| **Feldzeit** | 10 Arbeitstage |
| **Ziel-Rücklauf** | ≥ 80 % (≥ 32 Antworten), Minimum für Aussagekraft: 70 % |
| **Tool** | Microsoft Forms (M365-Standard, keine Beschaffung nötig) |
| **Aufwand gesamt** | ca. 6–8 Personentage über 6 Wochen |
| **Ergebnis** | Slide Deck mit klarer Handlungsempfehlung + Rohdaten-Baseline für Welle 2 |

> **Platzhalter markiert mit `⟨…⟩`** müssen vor dem Start mit realen ZVV-Angaben
> (Bereichsnamen, Namen, Daten, Links) ersetzt werden.

---

## 1. Ausgangslage und Zielsetzung

### 1.1 Warum überhaupt messen

Der Kanton Zürich baut den KI-Einsatz in der Verwaltung aktiv aus (Projekt «SynerKI»:
organisatorische Verankerung + KI-Serviceplattform), Microsoft Copilot ist als Basisdienst
verfügbar, und es existiert ein kantonaler Leitfaden für den sicheren KI-Einsatz.
Das heisst: **Der Rahmen wird von oben gesetzt, die tatsächliche Nutzung entsteht aber
unten** — heute meistens ungesteuert, unsichtbar und ungleich verteilt.

Der ZVV steht damit vor der klassischen Lücke:

- Es gibt **keine belastbare Zahl**, wie viele Mitarbeitende KI-Tools produktiv nutzen.
- Es gibt **keine Übersicht über Use Cases**, die real funktionieren.
- Es ist **unbekannt, wie viel Nutzung über private Konten / Privatgeräte** läuft
  («Shadow AI») — das ist die eigentliche Governance-Frage, nicht die Tool-Frage.
- Enablement-Budget (Schulung, Lizenzen, Pilotprojekte) wird ohne Faktenbasis vergeben.

### 1.2 Die vier Fragen, die das Deck am Ende beantworten muss

Alles im Fragekatalog dient exakt diesen vier Fragen. Was keiner davon dient, fliegt raus.

| # | Leitfrage | Entscheidung, die daraus folgt |
|---|---|---|
| **L1** | Wie hoch ist die aktive Nutzung heute — und wie verteilt sie sich? | Ist der ZVV in der Pionier-, Früh- oder Breitenphase? Bestimmt Tempo aller Massnahmen. |
| **L2** | Wofür wird KI konkret genutzt und was bringt es? | Welche Use Cases werden standardisiert und breit ausgerollt? |
| **L3** | Was blockiert die Nichtnutzenden? | Wo investieren: Regeln, Schulung, Zugang oder Führungssignal? |
| **L4** | Wo liegt das grösste ungenutzte Potenzial im ZVV-Kerngeschäft? | Welche 2–3 Pilotprojekte starten im nächsten Halbjahr? |

### 1.3 Explizite Nicht-Ziele

Diese Abgrenzung gehört in die Einladungsmail — sie ist der wichtigste Vertrauenshebel.

- **Keine Leistungsbeurteilung.** Ergebnisse fliessen nicht in MAG/Zielvereinbarungen ein.
- **Keine Compliance-Kontrolle.** Wer angibt, ChatGPT privat zu nutzen, wird nicht gesucht.
- **Kein Tool-Beschaffungsentscheid** über die Köpfe hinweg.
- **Keine Personalabbau-Analyse.** Wird sonst hineingelesen und senkt den Rücklauf massiv.

---

## 2. Designentscheide (das Rational)

Dieser Abschnitt ist die Begründungskette. Wer das Vorgehen hinterfragt, bekommt hier die
Antwort.

### 2.1 Entscheid: Vollerhebung, keine Stichprobe

**Weil N ≈ 40.** Bei dieser Grösse ist jede Stichprobe methodisch sinnlos — eine Antwort
entspricht 2.5 Prozentpunkten. Konsequenz für die gesamte Kommunikation: Es geht nicht um
«bitte nehmen Sie teil», sondern um **«jede einzelne Antwort verschiebt das Ergebnis
sichtbar»**. Diese Botschaft ist bei kleinen Organisationen der stärkste Rücklauf-Treiber,
weil sie wahr ist.

### 2.2 Entscheid: Anonymität ist bei N ≈ 40 ein Rechenproblem, kein Versprechen

Das grösste Risiko dieses Cases: Eine Person füllt ehrlich aus, und aus
«Bereich Markt» + «Führungsfunktion» + «nutzt täglich ChatGPT privat» ist sie identifizierbar.
Passiert das einmal sichtbar, ist jede Folgebefragung im ZVV tot.

**Regelwerk (nicht verhandelbar):**

| Regel | Umsetzung |
|---|---|
| **R1 — Keine Namen** | MS Forms: «Namen nicht erfassen». Link-Freigabe so wählen, dass keine Identität protokolliert wird. Vor dem Feld-Start mit Testantwort verifizieren. |
| **R2 — Nur eine Segmentachse pro Auswertung** | Es wird **nie** nach zwei demografischen Merkmalen gleichzeitig gefiltert (z. B. Bereich × Führung). Nur eindimensionale Schnitte. |
| **R3 — Mindestzellengrösse n ≥ 5** | Segmente mit weniger als 5 Antworten werden zu «Übrige Bereiche» zusammengefasst. Gilt auch für Zwischenauswertungen und Balkendiagramme im Deck. |
| **R4 — Grobe Segmente statt echter Bereiche** | Statt 7–8 realer Organisationseinheiten nur 4 Cluster (siehe 3.2). |
| **R5 — Keine Führungsfrage, kein Alter, kein Geschlecht, keine Anstellungsdauer** | Bringt für L1–L4 nichts und erzeugt nur Identifizierbarkeit. Bewusst weggelassen. |
| **R6 — Freitexte werden paraphrasiert** | Kein Zitat gelangt wörtlich ins Deck, wenn es Schreibstil, Projekt oder Dossier verrät. Paraphrase durch 2 Personen freigegeben. |
| **R7 — Opt-in strikt getrennt** | Wer sich für Pilot/Community melden will, nutzt ein **separates zweites Formular** (Link auf der Danke-Seite). Ein Namensfeld im Hauptformular würde die Anonymität faktisch aufheben. |

### 2.3 Entscheid: Verhalten messen, nicht Meinung

Klassischer Fehler: «Wie stehen Sie zu Künstlicher Intelligenz?» — misst soziale
Erwünschtheit, nicht Realität. Deshalb:

- **Verhaltensanker statt Skalen**, wo immer möglich: «Wie oft haben Sie in den **letzten
  4 Wochen** …» statt «Nutzen Sie regelmässig …».
- **Use-Case-Matrix statt Globalfrage**: Menschen unterschätzen ihre Nutzung, bis man ihnen
  konkrete Tätigkeiten vorlegt. Die Matrix in Block B6 ist der Kern des Fragebogens.
- **Ein erzwungener Konkret-Freitext**: «Nennen Sie eine Aufgabe der letzten Woche.»
  Liefert die Zitate und Use Cases für das Deck — und validiert die Selbsteinschätzung.

Fachlicher Bezugsrahmen: Die Blöcke folgen sinngemäss den UTAUT-Konstrukten
(Nutzenerwartung, Aufwandserwartung, sozialer Einfluss, unterstützende Bedingungen),
sind aber in Alltagssprache und auf ZVV-Tätigkeiten übersetzt. Der Fragebogen bleibt
dadurch anschlussfähig an die Fachliteratur, ohne akademisch zu klingen.

### 2.4 Entscheid: Shadow AI wird mit Amnestie-Framing erhoben

Der wertvollste Datenpunkt («Ich nutze KI über mein privates Konto, weil es dienstlich
nicht geht») wird nur geliefert, wenn Straffreiheit **explizit und schriftlich im Formular**
steht. Formulierung siehe Block B4. Ohne dieses Framing bekommt man geschönte Zahlen —
und trifft Governance-Entscheide auf falscher Basis.

### 2.5 Entscheid: Maximal 8 Minuten, maximal 24 sichtbare Fragen

Rücklauf ist primär eine Funktion von wahrgenommenem Aufwand. Konsequenzen:

- **Branching** so, dass Nichtnutzende nur ca. 12 Fragen sehen (sie sind schnell durch und
  brechen nicht ab — genau ihre Antworten fehlen sonst).
- **Nur 2 Pflicht-Freitexte**, alle übrigen optional.
- Die Zeitangabe **«5–8 Minuten» steht im Betreff, in der Einladung und auf Seite 1**.
  Sie muss stimmen: vorher mit 3 Testpersonen stoppen.

### 2.6 Entscheid: Microsoft Forms — bewusst, mit bekannten Grenzen

| Kriterium | Bewertung |
|---|---|
| Verfügbarkeit | ✅ Bereits im M365-Tenant, keine Beschaffung, keine neue Datenbearbeitung ausserhalb der bestehenden Umgebung. |
| Anonymität | ✅ Möglich, aber **muss aktiv konfiguriert werden** (Default kann Namen erfassen). |
| Verzweigungen | ✅ Unbegrenzt, aber **nur vorwärts** — Fragebogen muss linear gedacht werden. |
| Grenzen | Max. 200 Fragen / Formular (hier irrelevant), Antwortlimit weit über Bedarf. |
| Auswertung | ⚠️ Bordauswertung ist zu schwach für Segmente. **Export nach Excel ist Pflicht**, Auswertung dort oder in Python. |
| Matrixfragen | ⚠️ «Likert»-Typ vorhanden, auf Mobile aber unangenehm. Matrix auf max. 10 Zeilen begrenzen. |

**Fallback:** Falls das Erfassen von Namen technisch nicht sicher deaktivierbar ist
(Tenant-Policy), Formular als «Anyone with the link» ausrollen und den Link ausschliesslich
per Mail verteilen. Anonymität schlägt Zugriffskontrolle — bei einer internen 40-Personen-
Befragung ist Mehrfachteilnahme kein realistisches Risiko.

### 2.7 Entscheid: Diese Welle ist eine Baseline

Der Fragebogen wird so gebaut, dass **Block A, B und D in Welle 2 (in 9–12 Monaten)
wortgleich** wiederholt werden. Nur so entsteht eine Trendaussage
(«aktive Nutzung von 38 % auf 61 %»). Änderungen an diesen Blöcken sind ab Freigabe
gesperrt. Blöcke F und G dürfen sich entwickeln.

---

## 3. Zielgruppe und Segmentierung

### 3.1 Grundgesamtheit

Alle Mitarbeitenden der ZVV-Geschäftsstelle ⟨inkl./exkl. Praktika, Lernende, Temporäre —
festlegen⟩. Nicht einbezogen: Mitarbeitende der Transportunternehmen (andere Arbeitgeber,
andere IT-Umgebung, andere Governance). Falls diese später interessieren: eigene Welle,
eigener Fragebogen.

### 3.2 Segmentachsen (nur diese drei)

| Achse | Ausprägungen | Zweck |
|---|---|---|
| **S1 — Bereichscluster** | Angebot & Planung · Markt & Kommunikation · Finanzen, Recht & Tarif · Zentrale Dienste / Übrige | Wo ist die Nutzung ungleich verteilt? Bewusst grob (R4). ⟨Cluster an reale ZVV-Struktur anpassen — jeder Cluster muss ≥ 6 Personen umfassen.⟩ |
| **S2 — Tätigkeitsprofil** | Mehrfachauswahl: Analyse & Daten · Texte & Kommunikation · Recht & Verträge · Fachkonzepte & Planung · Koordination & Administration | Use Cases hängen an Tätigkeit, nicht an Abteilung. Wichtigste Achse für L2/L4. |
| **S3 — Nutzungsintensität** | Intensiv (≥ mehrmals/Woche) · Gelegentlich · Getestet, wieder aufgehört · Nie genutzt | Wird aus B1/B2 abgeleitet, nicht separat gefragt. Hauptachse des Decks. |

---

## 4. Fragekatalog

**Legende Feldtypen (MS Forms):** `SC` = Auswahl (Einfach) · `MC` = Auswahl (Mehrfach) ·
`LIK` = Likert/Matrix · `TXT` = Text · `NPS` = Bewertung.
**P** = Pflichtfeld.

### Seite 1 — Titel und Zusicherung (keine Frage)

> **Titel:** KI-Tools im ZVV: Wie arbeiten wir heute?
>
> **Einleitungstext (wörtlich übernehmbar):**
>
> Wir wollen wissen, wie KI-Tools im ZVV heute tatsächlich genutzt werden — nicht, wie es
> aussehen sollte. Die Ergebnisse bestimmen, worin wir im nächsten Jahr investieren:
> Schulung, Zugang, klare Regeln oder konkrete Pilotprojekte.
>
> **Das Wichtigste vorab:**
> - Die Umfrage ist **anonym**. Es werden keine Namen und keine Benutzerkonten erfasst.
> - Auswertungen erfolgen nur in Gruppen ab 5 Antworten. Einzelne Antworten sind nicht
>   zurückverfolgbar.
> - Es gibt **keine falschen Antworten**. Wenn Sie KI nie nutzen, ist genau das die
>   Information, die wir brauchen.
> - Dauer: **5–8 Minuten**. Feldzeit bis ⟨Datum⟩.
> - Die Ergebnisse werden am ⟨Datum, Gefäss⟩ allen vorgestellt — vollständig, auch die
>   unangenehmen Teile.
>
> ⟨Name Sponsor / Geschäftsleitung⟩

---

### Block A — Einordnung (3 Fragen, alle Teilnehmenden)

**A1 · `SC` · P — In welchem Bereich arbeiten Sie?**
- Angebot & Planung
- Markt & Kommunikation
- Finanzen, Recht & Tarif
- Zentrale Dienste / Übrige

*Hinweistext unter der Frage:* «Bewusst grob gefasst, damit keine Rückschlüsse auf einzelne
Personen möglich sind.»

**A2 · `MC` · P — Was macht den grössten Teil Ihrer Arbeit aus? (max. 2)**
- Analyse, Daten, Zahlen
- Texte, Kommunikation, Präsentationen
- Recht, Verträge, Tarif- und Regulierungsfragen
- Fachkonzepte, Planung, Projekte
- Koordination, Administration, Support

**A3 · `SC` — Wie vertraut sind Sie generell mit digitalen Tools?**
1 Ich brauche oft Unterstützung · 2 · 3 Durchschnittlich · 4 · 5 Ich probiere Neues von selbst aus

---

### Block B — Tatsächliche Nutzung (Kernblock)

**B1 · `SC` · P — Haben Sie in den letzten 4 Wochen ein KI-Tool für Ihre Arbeit genutzt?**
*(Gemeint sind Tools wie Microsoft Copilot, ChatGPT, Claude, Gemini, DeepL, Perplexity o. ä.)*
- Ja, regelmässig
- Ja, vereinzelt
- Nein, aber ich habe es früher ausprobiert → **Sprung zu Block D**
- Nein, noch nie → **Sprung zu Block D**

> **Verzweigung:** Nur «Ja»-Antworten sehen B2–C4. Alle anderen springen direkt zu D.
> MS Forms verzweigt nur vorwärts — die Reihenfolge im Formular muss exakt so bleiben.

**B2 · `SC` · P — Wie oft nutzen Sie KI-Tools für die Arbeit?**
- Täglich · Mehrmals pro Woche · Etwa wöchentlich · Etwa monatlich · Seltener

**B3 · `MC` · P — Welche Tools nutzen Sie für die Arbeit? (Mehrfachnennung)**
- Microsoft Copilot (dienstlich bereitgestellt)
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Gemini (Google)
- DeepL / Übersetzungstools
- Perplexity oder andere KI-Suche
- KI-Funktionen in Fachanwendungen ⟨z. B. GIS-, BI-, Planungstools des ZVV nennen⟩
- Bild-/Video-/Präsentationsgeneratoren
- Andere → `TXT` optional

**B4 · `SC` · P — Über welchen Zugang läuft das hauptsächlich?**

*Hinweistext (Amnestie-Framing, wörtlich):* «Diese Frage dient ausschliesslich dazu, Lücken
im dienstlichen Angebot zu erkennen. Es hat keine personellen Konsequenzen — die Antwort
ist anonym und wird nur als Gesamtzahl ausgewertet.»

- Dienstliches Konto auf dem Arbeitsgerät
- Privates Konto auf dem Arbeitsgerät
- Privates Konto auf dem Privatgerät (auch für Arbeitsaufgaben)
- Gemischt
- Weiss nicht

**B5 · `LIK` · P — Wie oft nutzen Sie KI für diese Aufgaben?**
*Skala: Nie · Selten · Manchmal · Oft*

| Zeile |
|---|
| Texte formulieren oder überarbeiten (Mails, Vorlagen, Berichte) |
| Zusammenfassen langer Dokumente (Studien, Berichte, Vernehmlassungen) |
| Recherche und Einordnung (Gesetze, Bundesvorgaben, Fachthemen) |
| Übersetzungen (DE/FR/IT/EN) |
| Daten und Tabellen auswerten, Formeln, Auswertungslogik |
| Präsentationen und Entscheidungsgrundlagen erstellen |
| Protokolle, Sitzungsnotizen, Pendenzen |
| Ideen sammeln, Varianten durchspielen, Sparring |
| Programmieren / Skripte / Automatisierungen |
| Prüfen und Gegenlesen eigener Arbeit |

*→ Diese Matrix ist die wichtigste Einzelfrage des Fragebogens. Sie liefert die
Use-Case-Landkarte für L2 und den Ausgangspunkt für die Pilotauswahl.*

**B6 · `SC` — Wie viel Ihrer Arbeitszeit wird von KI-Tools berührt?**
- Unter 5 % · 5–15 % · 15–30 % · Über 30 % · Kann ich nicht abschätzen

---

### Block C — Nutzen und Vertrauen (nur Nutzende)

**C1 · `SC` · P — Wie viel Zeit sparen Sie dadurch pro Woche, realistisch geschätzt?**
- Keine spürbare Ersparnis · Bis 1 Std. · 1–3 Std. · 3–5 Std. · Über 5 Std. · Nicht abschätzbar

*Hinweistext:* «Grobschätzung genügt. ‹Keine Ersparnis› ist eine ebenso wertvolle Antwort.»

**C2 · `LIK` — Wie wirkt sich der Einsatz aus?**
*Skala: Trifft nicht zu · Eher nicht · Eher · Trifft zu*
- Ich werde schneller fertig
- Die Qualität meiner Ergebnisse wird besser
- Ich traue mich an Aufgaben, die ich sonst nicht angegangen wäre
- Ich muss die Ergebnisse so stark nachkontrollieren, dass sich der Aufwand kaum lohnt
- Ich bin unsicher, ob ich die Ergebnisse verantworten kann

**C3 · `TXT` · P — Nennen Sie eine konkrete Aufgabe der letzten Wochen, bei der ein KI-Tool
Ihnen wirklich geholfen hat.**
*Hinweistext:* «1–2 Sätze genügen. Bitte keine Namen, keine Dossier- oder Projektbezeichnungen.»

**C4 · `SC` — Wie gehen Sie mit den Ergebnissen um?**
- Ich prüfe grundsätzlich alles nach
- Ich prüfe stichprobenartig
- Bei Routineaufgaben übernehme ich meist direkt
- Kommt stark auf die Aufgabe an

---

### Block D — Hürden (alle Teilnehmenden, auch Nichtnutzende)

**D1 · `MC` · P — Was hält Sie am stärksten davon ab, KI-Tools (mehr) zu nutzen? (max. 3)**
- Ich weiss nicht, was erlaubt ist (Datenschutz, Amtsgeheimnis, Personendaten)
- Ich habe dienstlich keinen oder nur eingeschränkten Zugang
- Ich weiss nicht, wie ich anfangen soll / mir fehlt die Übung
- Ich sehe für meine Aufgaben keinen echten Nutzen
- Die Ergebnisse waren bisher zu ungenau oder zu oberflächlich
- Mir fehlt die Zeit, mich einzuarbeiten
- Ich habe Bedenken bezüglich Qualität und Verantwortung
- Es ist mir unangenehm, wenn andere merken, dass ich KI nutze
- Nichts davon, ich nutze es bereits so viel wie sinnvoll

**D2 · `LIK` · P — Wie sicher fühlen Sie sich beim Thema Regeln?**
*Skala: Trifft nicht zu · Eher nicht · Eher · Trifft zu*
- Ich weiss, welche Daten ich in KI-Tools eingeben darf und welche nicht
- Ich kenne die Vorgaben des Kantons bzw. des ZVV zum KI-Einsatz
- Ich weiss, an wen ich mich bei einer Frage dazu wenden kann
- Ich weiss, dass mein Team und meine Vorgesetzten den Einsatz mittragen

*→ Liefert den «Governance-Gap»: Der Unterschied zwischen «Regeln existieren» und
«Regeln sind bekannt» ist meist die günstigste und wirksamste Massnahme im ganzen Case.*

**D3 · `MC` · P — Was würde Ihnen am meisten helfen? (max. 3)**
- Eine klare, kurze Regel: was ist erlaubt, was nicht
- Dienstlicher Zugang zu einem geprüften Tool
- Eine kurze Einführung (60–90 Min.) mit Beispielen aus meinem Arbeitsalltag
- Fertige Vorlagen/Prompts für wiederkehrende ZVV-Aufgaben
- Ansprechpersonen im Haus, die man kurz fragen kann
- Gemeinsames Ausprobieren im Team statt allein
- Ein sichtbares Signal der Geschäftsleitung, dass Nutzung erwünscht ist
- Nichts davon

---

### Block E — Potenzial im ZVV-Kerngeschäft (alle)

**E1 · `MC` · P — Wo sehen Sie im ZVV das grösste Potenzial? (max. 3)**
⟨An reale ZVV-Aufgaben anpassen — Vorschlag:⟩
- Angebots- und Fahrplanplanung, Varianten- und Wirkungsanalysen
- Tarif-, Rechts- und Regulierungsfragen (Recherche, Vergleiche, Entwürfe)
- Marktforschung und Kundendatenauswertung
- Kundenkommunikation und Kampagnen
- Kundeninformation und Kundendialog
- Vergabe- und Ausschreibungsunterlagen
- Controlling, Reporting, Kennzahlen gegenüber Transportunternehmen
- Sitzungen, Protokolle, Entscheidungsgrundlagen für Gremien und Politik
- Zusammenarbeit und Schnittstellen mit den Transportunternehmen
- Interne Administration und Prozesse

**E2 · `TXT` — Welchen wiederkehrenden Arbeitsschritt würden Sie sofort abgeben, wenn Sie
könnten?**
*Hinweistext:* «Die wertvollste Frage dieser Umfrage. Ein Satz genügt.»

**E3 · `SC` — Wie sollte der ZVV Ihrer Meinung nach vorgehen?**
- Klar vorangehen und Einsatz aktiv fördern
- Schritt für Schritt mit einzelnen Pilotprojekten
- Erst Regeln und Sicherheit klären, dann ausbauen
- Zurückhaltend bleiben und beobachten
- Keine Meinung

---

### Block F — Haltung und Kultur (alle, kurz)

**F1 · `LIK` — Wie sehen Sie die nächsten zwei Jahre?**
*Skala: Trifft nicht zu · Eher nicht · Eher · Trifft zu*
- KI wird meine tägliche Arbeit spürbar verändern
- Ich freue mich darauf
- Ich mache mir Sorgen um Qualität und Sorgfalt in der Verwaltungsarbeit
- Ich mache mir Sorgen um meine berufliche Zukunft
- Im ZVV wird offen darüber gesprochen, wer KI wie nutzt

**F2 · `TXT` — Gibt es etwas, das wir nicht gefragt haben, das aber wichtig ist?**
*(optional)*

---

### Danke-Seite

> Vielen Dank. Ihre Antwort zählt bei rund 40 Mitarbeitenden spürbar.
>
> Die Ergebnisse stellen wir am ⟨Datum, Gefäss⟩ vor — vollständig und ungeschönt.
>
> **Möchten Sie aktiv mitmachen?** Wenn Sie an einem Pilotprojekt oder einem internen
> Austausch teilnehmen möchten, tragen Sie sich hier ein: ⟨Link zweites Formular⟩
> *(Bewusst getrennt — damit Ihre Antworten oben anonym bleiben.)*

---

### 4.1 Fragenbilanz

| Gruppe | Sichtbare Fragen | Geschätzte Dauer |
|---|---|---|
| Nutzende | 20 | 7–8 Min. |
| Nichtnutzende | 12 | 3–4 Min. |
| Pflichtfelder gesamt | 11 (Nutzende) / 7 (Nichtnutzende) | — |
| Pflicht-Freitexte | 1 (C3, nur Nutzende) | — |

---

## 5. Umsetzung in Microsoft Forms

### 5.1 Aufbau (Reihenfolge zwingend einhalten)

MS Forms verzweigt **nur vorwärts**. Der Fragebogen muss deshalb genau in dieser Reihenfolge
angelegt werden — Blöcke nachträglich zu verschieben zerstört die Logik:

```
Seite 1  Titel + Zusicherung
Seite 2  A1  A2  A3
Seite 3  B1                       ← Verzweigungspunkt
Seite 4  B2  B3  B4  B5  B6       ← nur bei B1 = "Ja …"
Seite 5  C1  C2  C3  C4           ← nur bei B1 = "Ja …"
Seite 6  D1  D2  D3               ← alle
Seite 7  E1  E2  E3
Seite 8  F1  F2
Danke-Seite mit Opt-in-Link
```

### 5.2 Verzweigungsmatrix

| Frage | Antwort | Weiter zu |
|---|---|---|
| B1 | Ja, regelmässig | Seite 4 |
| B1 | Ja, vereinzelt | Seite 4 |
| B1 | Nein, früher ausprobiert | **Seite 6** |
| B1 | Nein, noch nie | **Seite 6** |
| Ende Seite 5 | — | Seite 6 |

### 5.3 Einstellungen — Pflicht-Checkliste

- [ ] **Namen werden nicht erfasst.** Nach dem Speichern mit einer Testantwort prüfen:
      Enthält der Excel-Export eine Spalte «Name» oder «E-Mail»? → Wenn ja, Konfiguration
      korrigieren, Testantworten löschen, erneut prüfen.
- [ ] Antwortoptionen: eine Antwort pro Person **nicht** erzwingen, wenn das Namenserfassung
      voraussetzt (R1 hat Vorrang, siehe 2.6 Fallback).
- [ ] Start-/Enddatum gesetzt (Feldzeit hart begrenzen — offene Umfragen werden nicht ausgefüllt).
- [ ] Fortschrittsbalken aktiv (senkt Abbruchquote).
- [ ] Fragenreihenfolge **nicht** zufällig mischen (bricht Auswertungsvergleich mit Welle 2).
- [ ] Dankestext mit Opt-in-Link hinterlegt.
- [ ] Sprache ⟨DE; falls nötig FR/EN-Variante als separates Formular + Ergebnisse zusammenführen⟩.
- [ ] Zweitformular «Pilot-Interesse» erstellt, mit Namenserfassung — **getrennt vom Hauptformular**.

### 5.4 Pretest (nicht überspringen)

3 Personen aus unterschiedlichen Bereichen, davon **mindestens eine, die KI nie nutzt**.
Auftrag: laut mitdenken, Zeit stoppen.

Abbruchkriterien für einen Redesign-Durchgang:
- Dauer > 9 Minuten → Fragen streichen (Kandidaten: A3, B6, C4, F1)
- Eine Frage wird zurückgefragt → umformulieren
- Nichtnutzende empfinden Block D als Vorwurf → Formulierung entschärfen
- Jemand zögert bei B4 → Amnestie-Framing verstärken oder Frage prominenter erklären

Testantworten **vor dem Livegang löschen** und Löschung dokumentieren.

---

## 6. Rücklauf maximieren

Ziel: ≥ 80 %. Bei N = 40 heisst das: **32 Antworten**. Das ist erreichbar, aber nur mit
aktivem Kampagnenmanagement — «Mail raus und hoffen» landet erfahrungsgemäss bei 35–50 %.

### 6.1 Die fünf Hebel, in Wirkungsreihenfolge

| # | Hebel | Konkret im ZVV |
|---|---|---|
| **1** | **Sichtbares Commitment der Leitung** | Die Einladung kommt von der Geschäftsleitung, nicht von «Projekt Digitalisierung». Zusätzlich mündliche Ankündigung in einem Leitungsgremium **eine Woche vorher**. |
| **2** | **Zeit dafür geben statt erbitten** | Explizit: «Nehmen Sie sich die 8 Minuten während der Arbeitszeit.» Ideal: 10 Minuten am Ende einer bestehenden Teamsitzung, alle füllen gleichzeitig aus — bringt in kleinen Organisationen oft 60 % Rücklauf am Tag 1. |
| **3** | **Relevanz statt Pflicht** | «Das Ergebnis entscheidet, ob es Schulungen, Zugänge oder Regeln gibt.» Menschen antworten, wenn eine Konsequenz sichtbar ist. |
| **4** | **Erreichte Angst wegnehmen** | Anonymitätszusage + Nicht-Ziele (1.3) stehen in **jeder** Nachricht, nicht nur in der ersten. |
| **5** | **Transparenter Zwischenstand** | Rücklaufquote als Gesamtzahl im Teamkanal posten («27 von ca. 40»). Nie nach Bereich aufschlüsseln — das erzeugt Druck und beschädigt Punkt 4. |

### 6.2 Kampagnenplan

| Tag | Kanal | Inhalt | Absender |
|---|---|---|---|
| **T−5** | Leitungsgremium / GL-Sitzung | Mündliche Ankündigung, Zweck, Anonymität | Sponsor |
| **T−1** | Teams-Kanal | «Morgen kommt eine kurze Umfrage — 8 Minuten, anonym» | Lead |
| **T0 (Di, 08:30)** | E-Mail an alle | Einladung + Link (Text unten) | Sponsor (GL) |
| **T0–T1** | Teamsitzungen | 10 Minuten gemeinsam ausfüllen, wo möglich | Teamleitungen |
| **T+3** | Teams-Kanal | Zwischenstand «X von ca. 40 — danke!» | Lead |
| **T+5 (Di)** | E-Mail Reminder 1 | An alle (anonym, deshalb keine Zielgruppentrennung möglich) | Lead |
| **T+8** | Teams + persönliche Ansprache in Teams mit tiefem Rücklauf | Ohne Namensnennung, über Teamleitung | Teamleitungen |
| **T+9 (Do)** | E-Mail Reminder 2 | «Letzte Chance, morgen schliesst die Umfrage» | Sponsor |
| **T+10 (Fr, 17:00)** | — | Feld schliessen | Lead |
| **T+11** | Teams | Rücklaufquote + Dank + Termin der Ergebnispräsentation | Sponsor |

**Wichtig:** Da anonym erhoben wird, ist **kein gezieltes Nachfassen bei Nichtteilnehmenden
möglich**. Das ist der bewusst akzeptierte Preis für R1 — kompensiert durch Hebel 2 und die
Teamleitungen.

### 6.3 Textbausteine

**Einladung (T0), Betreff:** `KI-Tools im ZVV: 8 Minuten Ihrer Erfahrung — anonym`

> Liebe Mitarbeitende
>
> KI-Tools verändern gerade, wie in Verwaltungen gearbeitet wird. Beim ZVV wissen wir
> ehrlich gesagt nicht, wie stark das bei uns bereits der Fall ist. Genau das möchten wir
> herausfinden — von Ihnen, nicht über Sie.
>
> **⟨Link⟩** — 5 bis 8 Minuten, anonym, bis ⟨Datum⟩.
>
> Was mit den Antworten passiert: Wir werten aus, wo KI heute im ZVV tatsächlich hilft, was
> fehlt und was blockiert. Daraus entscheiden wir im ⟨Monat⟩ konkret über Zugänge,
> Schulungen, Regeln und mögliche Pilotprojekte. Die Ergebnisse stellen wir am ⟨Datum⟩
> allen vor — vollständig.
>
> Drei Dinge, die uns wichtig sind:
> - Es werden **keine Namen und keine Konten erfasst.** Auswertungen erfolgen nur in
>   Gruppen ab fünf Antworten.
> - Es geht **nicht um Beurteilung und nicht um Kontrolle.** Wenn Sie KI nie nutzen, ist
>   das eine ebenso wichtige Antwort wie tägliche Nutzung.
> - Bitte nehmen Sie sich die Zeit **während der Arbeitszeit**.
>
> Wir sind rund 40 Personen. Jede einzelne Antwort verschiebt das Ergebnis sichtbar.
>
> Herzlichen Dank ⟨Name, Geschäftsleitung⟩

**Reminder 1 (T+5), Betreff:** `Noch offen: 8 Minuten zu KI-Tools im ZVV`

> Bisher haben ⟨X⟩ von rund 40 Personen geantwortet — vielen Dank dafür.
>
> Falls Sie noch nicht dazu gekommen sind: **⟨Link⟩**, 5–8 Minuten, bis ⟨Datum⟩.
>
> Besonders wertvoll sind die Antworten von Personen, die KI **nicht** nutzen. Genau
> diese Perspektive fehlt in solchen Umfragen meistens — und führt dann zu Massnahmen,
> die an den Leuten vorbeigehen. Der Fragebogen dauert für Sie nur rund 3 Minuten.
>
> Weiterhin anonym, weiterhin ohne Namenserfassung.

**Reminder 2 (T+9), Betreff:** `Morgen schliesst die KI-Umfrage`

> Kurz und bündig: Die Umfrage läuft noch bis morgen ⟨Datum⟩ 17:00. Aktueller Stand:
> ⟨X⟩ von rund 40. **⟨Link⟩**
>
> Ab ⟨X+n⟩ Antworten können wir auch nach Bereichen auswerten — darunter nicht, weil wir
> die Anonymität nicht gefährden. Es lohnt sich also wirklich. Danke!

---

## 7. Auswertung

### 7.1 Ablauf

1. **Export** aus MS Forms nach Excel. Datei sofort ablegen unter
   ⟨geschützter Ablageort⟩ mit Zugriff nur für Lead + Co.
2. **Rohdatenprüfung:** Testantworten entfernt? Durchklicker erkennen
   (Bearbeitungszeit < 90 Sek. **und** keine Freitextantwort → als «Speed-Run» markieren,
   nicht löschen, sondern in einer Sensitivitätsrechnung prüfen, ob sie das Ergebnis kippen).
3. **Anonymitätsprüfung vor jeder Auswertung:** Zellenbesetzung je Segment zählen.
   Alles unter n = 5 wird zusammengefasst (R3). Diese Prüfung wird dokumentiert.
4. **Kennzahlen berechnen** (7.2).
5. **Freitexte codieren** (7.3).
6. **Kernaussagen formulieren** (7.4) — erst danach Slides bauen.

### 7.2 Kennzahlen-Set

| KPI | Berechnung | Interpretationsanker |
|---|---|---|
| **Rücklaufquote** | Antworten / Grundgesamtheit | ≥ 80 % = belastbar · 60–79 % = interpretierbar mit Vorbehalt · < 60 % = nur Richtungsaussage |
| **Aktive Nutzung** | Anteil B2 ∈ {täglich, mehrmals/Woche} | Die Headline-Zahl des Decks |
| **Breite Nutzung** | Anteil B1 ∈ {Ja regelmässig, Ja vereinzelt} | Reichweite |
| **Abbrecherquote** | Anteil B1 = «früher ausprobiert» | Wichtigstes Frühwarnsignal: hohe Werte = Tool-/Erwartungsproblem, nicht Zugangsproblem |
| **Shadow-AI-Quote** | Anteil B4 ∈ {privates Konto auf Arbeitsgerät, privates Konto/Privatgerät, gemischt} | Governance-Dringlichkeit |
| **Use-Case-Tiefe** | Ø Anzahl Aufgaben in B5 mit «oft»/«manchmal» | 1–2 = Spielerei · 3–5 = Arbeitsintegration · > 5 = Routine |
| **Nutzenrealisierung** | Anteil C1 ≥ «1–3 Std./Woche» unter Nutzenden | Ist der Nutzen real oder behauptet? |
| **Governance-Gap** | Anteil D2 «Ich weiss, welche Daten ich eingeben darf» = trifft (eher) nicht zu | Meist die billigste Massnahme mit der grössten Wirkung |
| **Erlaubnisklima** | Anteil D2 «Team/Vorgesetzte tragen mit» = trifft (eher) zu | Kulturindikator; tiefer Wert erklärt tiefe Nutzung besser als jedes Tool-Argument |
| **Blocker-Ranking** | Top-5 aus D1, getrennt nach Nutzenden / Nichtnutzenden | Steuert Massnahmenpriorisierung |
| **Enablement-Ranking** | Top-5 aus D3 | Definiert das Massnahmenpaket |
| **Potenzial-Ranking** | Top-5 aus E1 | Definiert die Pilotkandidaten |

**Die zentrale Kreuzauswertung** (und die einzige zulässige, weil beide Achsen
verhaltensbasiert und nicht demografisch sind): **Blocker (D1) × Nutzungsintensität (S3)**.
Nichtnutzende und Intensivnutzende nennen fast immer unterschiedliche Blocker — genau
dieser Unterschied ist die Massnahmenlogik.

### 7.3 Freitexte codieren (C3, E2, F2)

- Zwei Personen codieren unabhängig, gleichen ab, entscheiden Abweichungen gemeinsam.
- Kategorien induktiv bilden, danach auf **max. 8 Cluster** verdichten.
- Jede Nennung, die eine Person identifizierbar macht, wird **paraphrasiert oder verworfen** (R6).
- E2 («welchen Arbeitsschritt würden Sie abgeben») separat behandeln: Das ist die
  **Pilot-Pipeline**. Jede Nennung nach Aufwand × Wirkung × Datensensitivität einordnen.

### 7.4 Von Zahlen zu Aussagen

Jede Kennzahl wird in einen Satz nach diesem Muster übersetzt — **erst wenn der Satz steht,
wird die Folie gebaut**:

> «⟨Beobachtung mit Zahl⟩ — das bedeutet ⟨Konsequenz für den ZVV⟩ — deshalb ⟨Empfehlung⟩.»

Beispiele (Zahlen fiktiv, Struktur verbindlich):
- «38 % nutzen KI mindestens wöchentlich, aber 61 % davon über private Konten — der ZVV
  hat kein Adoptions-, sondern ein Zugangsproblem. Dienstlicher Zugang vor Schulung.»
- «Der meistgenannte Blocker ist nicht fehlender Nutzen, sondern Unsicherheit über die
  Regeln (⟨n⟩ Nennungen) — eine einseitige Klarstellung wirkt schneller als jedes Tool.»
- «Nur ⟨n⟩ Personen nennen ‹kein Nutzen für meine Aufgaben› — die Skepsis ist geringer als
  angenommen, das Tempo kann höher sein.»

### 7.5 Auswertungsgerüst (optional, Python)

Wenn die Auswertung reproduzierbar sein soll (empfohlen, weil Welle 2 folgt):

```python
import pandas as pd

df = pd.read_excel("zvv_ki_umfrage_export.xlsx")
N_GESAMT = 40           # Grundgesamtheit
MIN_ZELLE = 5           # Anonymitätsschwelle R3

ruecklauf = len(df) / N_GESAMT

nutzend = df["B1"].isin(["Ja, regelmässig", "Ja, vereinzelt"])
aktiv   = df["B2"].isin(["Täglich", "Mehrmals pro Woche"])
shadow  = df["B4"].isin(["Privates Konto auf dem Arbeitsgerät",
                         "Privates Konto auf dem Privatgerät (auch für Arbeitsaufgaben)",
                         "Gemischt"])

def segment(spalte):
    """Auszählung mit Anonymitätsschwelle: Kleinstgruppen werden zusammengefasst."""
    v = df[spalte].value_counts()
    klein = v[v < MIN_ZELLE]
    v = v[v >= MIN_ZELLE]
    if len(klein):
        v["Übrige (zusammengefasst)"] = klein.sum()
    return v

print(f"Rücklauf:        {ruecklauf:.0%} ({len(df)}/{N_GESAMT})")
print(f"Nutzung breit:   {nutzend.mean():.0%}")
print(f"Aktive Nutzung:  {aktiv.mean():.0%}")
print(f"Shadow AI:       {shadow[nutzend].mean():.0%} der Nutzenden")
print(segment("A1"))
```

⟨Spaltennamen nach dem Export an die tatsächlichen Fragetexte anpassen — MS Forms
exportiert den vollständigen Fragetext als Spaltenkopf.⟩

---

## 8. Slide Deck

**Format:** 12 Folien, 20 Minuten Präsentation, 20 Minuten Diskussion.
**Prinzip:** Jede Folie hat einen **Aussagetitel** — eine vollständige Behauptung, keine
Themenüberschrift. «Nutzung nach Bereich» ist kein Titel. «Die Nutzung konzentriert sich
auf zwei Bereiche» ist einer. Wer nur die Titel liest, kennt die ganze Geschichte.

### 8.1 Storyline

| # | Folie | Aussagetitel (Muster) | Inhalt |
|---|---|---|---|
| 1 | Titel | KI im ZVV: Was wir tun — und was wir tun sollten | Titel, Datum, Rücklaufquote als Gütesiegel |
| 2 | Management Summary | ⟨Die eine Kernaussage in einem Satz⟩ | 3 Befunde, 3 Empfehlungen, 1 Entscheidungsbedarf. **Diese Folie muss allein funktionieren.** |
| 3 | Vorgehen | ⟨X⟩ von 40 Mitarbeitenden haben geantwortet — die Basis ist belastbar | Methode, Feldzeit, Anonymitätsregeln (schafft Vertrauen in die Zahlen) |
| 4 | Nutzung heute | ⟨X⟩ % nutzen KI mindestens wöchentlich | Verteilung Intensiv / Gelegentlich / Abgebrochen / Nie |
| 5 | Verteilung | Die Nutzung ist ungleich verteilt — sie folgt der Tätigkeit, nicht der Abteilung | Nutzung nach Tätigkeitsprofil (S2), Segmente ≥ 5 |
| 6 | Use Cases | KI wird heute vor allem für ⟨Top-3⟩ eingesetzt | Heatmap aus B5 |
| 7 | Nutzen | Nutzende sparen ⟨X⟩ Stunden pro Woche — hochgerechnet ⟨Y⟩ Stellenprozente | C1 + C2, mit klar deklarierter Schätzunsicherheit |
| 8 | Shadow AI | ⟨X⟩ % der Nutzung läuft über private Konten | B4. **Die Folie, die den Handlungsdruck erzeugt.** Ohne Schuldzuweisung formulieren. |
| 9 | Hürden | Der grösste Blocker ist ⟨…⟩ — nicht fehlender Nutzen | D1 × Nutzungsintensität, Nutzende vs. Nichtnutzende gegenübergestellt |
| 10 | Bedarf | Gewünscht wird vor allem ⟨Top-3⟩ | D3 + Governance-Gap aus D2 |
| 11 | Potenzial | Das grösste Potenzial sehen die Mitarbeitenden in ⟨Top-3⟩ | E1 + ausgewählte paraphrasierte Zitate aus E2 |
| 12 | Empfehlung | Drei Massnahmen, ein Entscheid | Massnahmenpaket mit Aufwand, Wirkung, Verantwortung, Termin |

**Anhang (nicht präsentiert, mitgeliefert):** vollständiger Fragebogen, alle Häufigkeiten,
Codierschema der Freitexte, Anonymitätsprotokoll.

### 8.2 Die Empfehlungsfolie (Folie 12)

Ohne diese Folie war die Umfrage Selbstzweck. Struktur:

| Massnahme | Was konkret | Aufwand | Wirkung | Wer | Bis |
|---|---|---|---|---|---|
| **Sofort (0–4 Wo.)** | ⟨z. B. einseitige Regel «Was darf rein, was nicht» + Ansprechperson benennen⟩ | tief | hoch | ⟨…⟩ | ⟨…⟩ |
| **Kurzfristig (1–3 Mt.)** | ⟨z. B. dienstlicher Zugang klären, 90-Min-Einführung mit ZVV-Beispielen⟩ | mittel | hoch | ⟨…⟩ | ⟨…⟩ |
| **Pilot (3–6 Mt.)** | ⟨2 Use Cases aus E1/E2 mit klarem Erfolgskriterium⟩ | mittel | offen | ⟨…⟩ | ⟨…⟩ |

**Entscheidungsbedarf der GL** explizit ausformulieren, z. B.:
«Die GL entscheidet, ob KI-Nutzung im ZVV ausdrücklich erwünscht ist und dies kommuniziert
wird — oder ob wir bis zur kantonalen Plattform abwarten. Beides ist vertretbar, aber der
Status quo (private Konten, keine Regeln, kein Signal) ist die schlechteste der drei Optionen.»

### 8.3 Darstellungsregeln

- **Absolute Zahlen zusätzlich zu Prozenten** («38 % / 12 von 32»). Bei N = 40 sind reine
  Prozentangaben irreführend.
- Keine Segmentbalken unter n = 5 — auch nicht ausgegraut, sondern gar nicht (R3).
- Freitextzitate nur paraphrasiert und als solche gekennzeichnet (R6).
- Unangenehme Befunde kommen **vor** den angenehmen. Wer selbst zuerst die Lücke zeigt,
  behält die Deutungshoheit über die Empfehlung.

---

## 9. Rollen, Zeitplan, Aufwand

### 9.1 Rollen

| Rolle | Verantwortung | Aufwand |
|---|---|---|
| **Sponsor (GL)** | Auftrag, Absender der Einladung und des 2. Reminders, Ergebnispräsentation eröffnen | 0.5 PT |
| **Lead** | Fragebogen, MS Forms, Kampagne, Auswertung, Deck | 4–5 PT |
| **Co-Auswertung** | Zweitcodierung Freitexte, Gegenlesen Deck, Anonymitätsprüfung | 1 PT |
| **Teamleitungen** | Zeitfenster in Sitzungen, Nachfassen ohne Druck | je 0.5 Std. |
| **⟨Datenschutz / IT⟩** | Kurzfreigabe: anonyme interne Befragung im bestehenden M365-Tenant | 0.25 PT |
| **Pretest-Personen (3)** | Testdurchlauf mit Rückmeldung | je 0.5 Std. |

### 9.2 Zeitplan

| Woche | Meilenstein | Ergebnis |
|---|---|---|
| **W1** | Auftrag & Design | Sponsor bestätigt Ziel und Nicht-Ziele, Segmentcluster (3.2) definiert, ⟨Datenschutz⟩-Freigabe eingeholt |
| **W2** | Fragebogen fertig | Katalog auf ZVV angepasst, in MS Forms gebaut, Verzweigungen getestet, Anonymität mit Testantwort verifiziert |
| **W3** | Pretest & Ankündigung | 3 Pretests, Redesign, Testdaten gelöscht, Ankündigung im Leitungsgremium |
| **W4–W5** | Feld (10 Arbeitstage) | Kampagne nach 6.2, Rücklauf-Tracking, Feld schliesst Freitag 17:00 |
| **W6** | Auswertung | Export, KPI-Set, Freitextcodierung, Kernaussagen nach 7.4 formuliert |
| **W7** | Deck & Präsentation | Deck gebaut, mit Sponsor vorbesprochen, Präsentation vor GL und anschliessend **vor allen Mitarbeitenden** |
| **W7+2** | Nachlauf | Ergebnisse + Massnahmen im Intranet/Teams, Pilot-Opt-ins kontaktiert |

**Terminfallen:** Nicht über Schulferien Kanton Zürich, nicht in Budget-/Fahrplan-Hochphasen
⟨ZVV-Jahreszyklus prüfen⟩, Feldstart nie Freitag oder Montag.

---

## 10. Risiken und Gegenmassnahmen

| Risiko | Frühwarnsignal | Gegenmassnahme |
|---|---|---|
| **Rücklauf < 60 %** | Nach 3 Tagen < 15 Antworten | Feldzeit um 3 Tage verlängern, Ausfüllen in Teamsitzungen einplanen, Sponsor persönlich in einer Gesamtsitzung nachfassen. **Nicht** in Reminder 3 und 4 eskalieren — das kippt in Druck. |
| **Anonymität wird angezweifelt** | Rückfragen im Teamkanal | Sofort und öffentlich beantworten: was erfasst wird, wer die Rohdaten sieht, ab welcher Gruppengrösse ausgewertet wird. Ein Screenshot der Forms-Einstellung wirkt stärker als jede Zusicherung. |
| **Ergebnisse wirken beschönigt** | Sehr hohe Nutzungswerte, sehr wenig Kritik | Speed-Run-Prüfung (7.1), Konsistenzcheck B2 gegen B5 gegen C3. Wer «täglich» angibt, aber in B5 überall «nie» und C3 leer lässt, ist ein Signal für sozial erwünschtes Antworten. |
| **Umfrage wird als Rationalisierungs-Vorstufe gelesen** | Flurfunk, tiefer Rücklauf in einzelnen Teams | Nicht-Ziele (1.3) in jeder Nachricht wiederholen; Sponsor adressiert es aktiv und von sich aus im Leitungsgremium. |
| **Kleinstsegmente verlocken zur Auswertung** | «Wie ist es denn im Bereich X?» | R2/R3 sind vorab schriftlich mit dem Sponsor vereinbart. Antwort: «Zu klein — wir hätten das Anonymitätsversprechen gebrochen.» |
| **Ergebnis versandet** | Kein Folgetermin im Kalender | Der Termin für die Massnahmenentscheidung wird **vor dem Feldstart** gesetzt. Ohne diesen Termin nicht starten. |
| **Kantonale Vorgaben ändern während des Felds** | Neue Weisung/Plattform ⟨SynerKI⟩ | Kein Abbruch. Ergebnisse bleiben als Baseline gültig; im Deck einordnen statt neu erheben. |

---

## 11. Checklisten

### Vor dem Feldstart

- [ ] Ziel, Nicht-Ziele und die vier Leitfragen vom Sponsor bestätigt
- [ ] Grundgesamtheit definiert und gezählt (N = ⟨…⟩)
- [ ] Segmentcluster festgelegt, jeder ≥ 6 Personen
- [ ] ⟨Datenschutz-/IT-Freigabe⟩ eingeholt
- [ ] Fragebogen auf ZVV-Realität angepasst (E1, B3, A1)
- [ ] MS Forms: Namenserfassung deaktiviert **und mit Testantwort verifiziert**
- [ ] Verzweigung B1 in allen vier Ausprägungen durchgeklickt
- [ ] Pretest mit 3 Personen, Dauer ≤ 8 Min. bestätigt
- [ ] Testantworten gelöscht
- [ ] Zweitformular «Pilot-Interesse» erstellt und verlinkt
- [ ] Termine gesetzt: Ergebnispräsentation **und** Massnahmenentscheid
- [ ] Einladung und beide Reminder vorgeschrieben und freigegeben

### Vor der Auswertung

- [ ] Export gesichert, Zugriff auf Lead + Co beschränkt
- [ ] Speed-Runs markiert, Sensitivitätsrechnung gemacht
- [ ] Zellenbesetzung geprüft, Segmente < 5 zusammengefasst, Prüfung dokumentiert
- [ ] Freitexte doppelt codiert und abgeglichen
- [ ] Jede geplante Folie hat eine Kernaussage nach dem Muster in 7.4

### Vor der Präsentation

- [ ] Kein Zitat ist rückverfolgbar (R6, durch Co gegengelesen)
- [ ] Kein Diagramm zeigt eine Gruppe < 5
- [ ] Jede Folie hat einen Aussagetitel, keine Themenüberschrift
- [ ] Folie 2 funktioniert allein, ohne Vortrag
- [ ] Folie 12 nennt Verantwortliche und Termine, nicht nur Massnahmen
- [ ] Deck ist auch für alle Mitarbeitenden freigegeben, nicht nur für die GL

---

## 12. Anschluss und Wiederholung

- **Welle 2 nach 9–12 Monaten**, Blöcke A/B/D wortgleich (2.7). Vergleichsgrössen:
  aktive Nutzung, Shadow-AI-Quote, Governance-Gap, Use-Case-Tiefe.
- **Erfolgskriterien für die Massnahmen** bereits jetzt festhalten, z. B.:
  aktive Nutzung +20 Prozentpunkte, Shadow-AI-Quote halbiert, Governance-Gap unter 20 %.
- **Kantonaler Anschluss:** Ergebnisse eignen sich als ZVV-Beitrag Richtung
  ⟨Volkswirtschaftsdirektion / kantonale KI-Initiativen⟩ — eine belastbare Bedarfsmessung
  aus einer Fachstelle ist dort selten und verschafft Gewicht bei Zugangs- und
  Plattformentscheiden.
- **Wichtigstes Nachlaufversprechen:** Was in der Einladung angekündigt wurde, muss
  passieren. Eine Umfrage ohne sichtbare Folge senkt den Rücklauf jeder künftigen Befragung
  im ZVV dauerhaft — das ist der teuerste Fehler in diesem ganzen Case.

---

## Quellen und Grundlagen

- [Kanton Zürich: Künstliche Intelligenz in der Verwaltung](https://www.zh.ch/de/politik-staat/kanton/kantonale-verwaltung/digitale-verwaltung/kuenstliche-intelligenz.html)
- [Kanton Zürich treibt KI-Einsatz in der Verwaltung voran (Projekt SynerKI), it-markt.ch](https://www.it-markt.ch/news/2026-07-10/kanton-zuerich-treibt-ki-einsatz-in-der-verwaltung-voran)
- [Strategie Digitale Verwaltung 2025+, Kanton Zürich](https://www.zh.ch/de/politik-staat/kanton/kantonale-verwaltung/digitale-verwaltung/strategie-digitale-verwaltung-2025-.html)
- [ZVV Strategiebericht 2022–2025](https://www.zh.ch/content/dam/zhweb/bilder-dokumente/organisation/volkswirtschaftsdirektion/direktion/zvv_strategiebericht_2022-2025.pdf)
- [Zürcher Verkehrsverbund ZVV — Organisation und Mitarbeitende (LinkedIn)](https://www.linkedin.com/company/zuercher-verkehrsverbund-zvv/)
- [Microsoft Forms: Verzweigungslogik](https://support.microsoft.com/en-us/office/use-branching-logic-in-your-form-0a092a1c-8fe4-441c-9fc6-cd0aad3b52b2)
- [Microsoft Forms: Fragen- und Antwortlimiten](https://nordflux.de/en/insights/microsoft-forms-response-limits-branching-and-where-the-evaluation-stops)
- [Revisiting UTAUT for the Age of AI: Employee AI Adoption and Usage Patterns (arXiv)](https://arxiv.org/pdf/2510.15142)
- [Rogator: Massnahmen für höhere Rücklaufquoten bei Mitarbeiterfeedback](https://www.rogator.de/massnahmen-hoeheren-ruecklaufquoten-mitarbeiterfeedback/)
- [Haufe: Aussagekraft von Mitarbeiterbefragungen erhöhen](https://www.haufe.de/personal/hr-management/acht-tipps-aussagekraft-von-mitarbeiterbefragungen-erhoehen_80_589044.html)
