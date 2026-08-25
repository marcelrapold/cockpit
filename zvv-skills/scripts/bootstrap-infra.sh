#!/usr/bin/env bash
#
# Legt Repository, Vercel-Projekt und DNS-Eintrag fuer skills.zvv.dev an.
# Idempotent: Was es schon gibt, wird uebersprungen.
#
#   CF_API_TOKEN=… CF_ZONE_ID=… ./scripts/bootstrap-infra.sh
#
# Voraussetzungen: gh (angemeldet, Recht zum Anlegen in zvvch), vercel CLI,
# ein Cloudflare-Token mit Zone.DNS:Edit auf zvv.dev.
#
# Der Hintergrund zu jedem Schritt steht in docs/bootstrap.md.
set -euo pipefail

ORG="zvvch"
REPO="zvv-skills"
VERCEL_SCOPE="zvv"
DOMAIN="skills.zvv.dev"
SUBDOMAIN="skills"
VERCEL_CNAME="cname.vercel-dns.com"

say() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

require() {
  command -v "$1" >/dev/null 2>&1 || { echo "fehlt: $1" >&2; exit 1; }
}

require gh
require vercel
require git

say "1/3  GitHub: ${ORG}/${REPO}"
if gh repo view "${ORG}/${REPO}" >/dev/null 2>&1; then
  echo "Repository existiert bereits."
else
  gh repo create "${ORG}/${REPO}" \
    --private \
    --description "ZVV Skills — LLM-optimierte Business-Workflows. Live: ${DOMAIN}"
fi

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "git@github.com:${ORG}/${REPO}.git"
fi

git add -A
git diff --cached --quiet || git commit -m "feat: ZVV Skills Registry"
git push -u origin main

say "2/3  Vercel: ${VERCEL_SCOPE}/${REPO}"
vercel link --yes --scope "${VERCEL_SCOPE}" --project "${REPO}"
vercel git connect "git@github.com:${ORG}/${REPO}.git" --yes || true
vercel domains add "${DOMAIN}" --scope "${VERCEL_SCOPE}" || true
vercel --prod --yes

say "3/3  Cloudflare: CNAME ${SUBDOMAIN} → ${VERCEL_CNAME}"
if [ -z "${CF_API_TOKEN:-}" ] || [ -z "${CF_ZONE_ID:-}" ]; then
  echo "CF_API_TOKEN oder CF_ZONE_ID nicht gesetzt — DNS-Schritt übersprungen."
  echo "Manuell: CNAME ${SUBDOMAIN} → ${VERCEL_CNAME}, Proxy AUS."
  exit 0
fi

existing=$(curl -s -G "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  --data-urlencode "name=${DOMAIN}" \
  --data-urlencode "type=CNAME" | grep -o '"id":"[a-f0-9]\{32\}"' | head -1 | cut -d'"' -f4 || true)

if [ -n "${existing}" ]; then
  echo "CNAME existiert bereits (${existing}) — unverändert gelassen."
else
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"CNAME\",\"name\":\"${SUBDOMAIN}\",\"content\":\"${VERCEL_CNAME}\",\"ttl\":1,\"proxied\":false,\"comment\":\"${DOMAIN} → Vercel (${VERCEL_SCOPE}/${REPO})\"}"
  echo
fi

say "Fertig — prüfen:"
echo "  dig +short ${DOMAIN} CNAME"
echo "  curl -s https://${DOMAIN}/llms.txt | head -20"
