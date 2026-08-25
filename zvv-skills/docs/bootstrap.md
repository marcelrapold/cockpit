# Inbetriebnahme: Repo, Vercel, DNS

Drei Schritte von diesem Code zu `https://skills.zvv.dev`. Alle drei brauchen Rechte, die
ein Agent in der Regel nicht hat — deshalb hier als nachvollziehbare Anleitung, mit
`scripts/bootstrap-infra.sh` als ausführbarer Entsprechung.

Reihenfolge ist zwingend: Vercel kann kein Git-Projekt anlegen, bevor das Repo existiert,
und der DNS-Eintrag ist erst sinnvoll, wenn die Domain im Vercel-Projekt hinterlegt ist.

---

## 1. GitHub-Repository

Ziel: `zvvch/zvv-skills`, privat.

```bash
gh repo create zvvch/zvv-skills \
  --private \
  --description "ZVV Skills — LLM-optimierte Business-Workflows. Live: skills.zvv.dev"

git init
git branch -M main
git remote add origin git@github.com:zvvch/zvv-skills.git
git add .
git commit -m "feat: ZVV Skills Registry mit Analytics-Workflows"
git push -u origin main
```

Nötig: Recht, in der Organisation `zvvch` Repositories anzulegen.

Wenn der Code als Unterordner in einem anderen Repo liegt, lässt er sich mit
vollständiger Historie herauslösen:

```bash
git subtree split --prefix=zvv-skills -b zvv-skills-export
git push git@github.com:zvvch/zvv-skills.git zvv-skills-export:main
```

Danach im neuen Repo einmal prüfen, dass `.github/workflows/validate.yml` grün läuft.

---

## 2. Vercel-Projekt

Team `zvv` (`team_lLeixJvuVuXTtChUs2G9qKUL`).

```bash
vercel link --scope zvv --project zvv-skills
vercel git connect git@github.com:zvvch/zvv-skills.git
vercel domains add skills.zvv.dev --scope zvv
vercel --prod
```

Einstellungen: Framework `nextjs`, Build `npm run build`, Install `npm install`,
Production Branch `main`. Alles davon steht bereits in `vercel.json` beziehungsweise
ergibt sich aus dem Repo.

Environment-Variablen braucht die Site **keine**. `NEXT_PUBLIC_SITE_URL` kann auf
`https://skills.zvv.dev` gesetzt werden; ohne die Variable erkennt `lib/skills.ts` die
Produktionsumgebung selbst und fällt sonst auf die Deployment-URL zurück.

Öffentlich erreichbar heisst: Vercel Authentication im Projekt **aus**. Das ist eine
bewusste Entscheidung — der Inhalt ist Betriebswissen ohne Zugangsdaten, und Agenten
sollen die Endpunkte ohne Anmeldung lesen können. Falls der Atlas etwas anderes
vorschreibt, siehe [ATLAS.md](../ATLAS.md).

---

## 3. DNS bei Cloudflare

Zone `zvv.dev`, ein Eintrag:

| Typ | Name | Ziel | Proxy | TTL |
|-----|------|------|-------|-----|
| CNAME | `skills` | `cname.vercel-dns.com` | **aus** (DNS only) | Auto |

Der Proxy bleibt aus: Vercel stellt das Zertifikat selbst aus und terminiert TLS. Mit
eingeschaltetem Cloudflare-Proxy scheitert die Domain-Verifikation oder es entsteht eine
doppelte TLS-Terminierung.

Über die API:

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "skills",
    "content": "cname.vercel-dns.com",
    "ttl": 1,
    "proxied": false,
    "comment": "skills.zvv.dev → Vercel (zvv/zvv-skills)"
  }'
```

`CF_ZONE_ID` ist die Zone-ID von `zvv.dev` aus der Cloudflare-Übersicht. Das Token
braucht `Zone.DNS: Edit` auf dieser Zone.

Prüfen:

```bash
dig +short skills.zvv.dev CNAME
curl -sI https://skills.zvv.dev | head -1
curl -s https://skills.zvv.dev/llms.txt | head -20
```

Vercel meldet die Domain als `Valid Configuration`, sobald der Eintrag propagiert ist —
in der Regel innert Minuten.

---

## Abnahme

- [ ] `https://skills.zvv.dev` lädt und listet die Skills
- [ ] `https://skills.zvv.dev/llms.txt` liefert Klartext mit absoluten URLs auf `skills.zvv.dev`
- [ ] `https://skills.zvv.dev/api/skills` liefert JSON mit allen Skills
- [ ] `https://skills.zvv.dev/s/adobe-analytics/SKILL.md` liefert `text/markdown`
- [ ] `https://skills.zvv.dev/s/../package.json` antwortet mit 404
- [ ] GitHub Actions `validate` ist grün
