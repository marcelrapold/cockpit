# Login mit auth.rapold.io aktivieren

Cockpit kann den privaten Modus statt mit HTTP Basic Auth über den Rapold-IdP
[auth.rapold.io](https://auth.rapold.io) (Authelia, Repo
[mra-auth](https://github.com/marcelrapold/mra-auth)) schützen. Der Code ist auf `main`;
er wird erst aktiv, wenn **alle vier** Variablen `OIDC_ISSUER`, `OIDC_CLIENT_ID`,
`OIDC_CLIENT_SECRET` und `AUTH_SECRET` (mindestens 32 Zeichen) gesetzt sind. Bis dahin
gilt unverändert Basic Auth (`COCKPIT_PRIVATE_BASIC_AUTH`).

Diese Anleitung enthält keine Secrets. Klartext-Secret und `AUTH_SECRET` gehören in
1Password (Eintrag «OIDC cockpit»), der Digest nur in die `oidc.yml` im CT.

## Was die Implementierung macht

| Punkt | Wert |
|---|---|
| Ablauf | Authorization Code mit PKCE (`S256`), `state`, `nonce`, Prüfung von `iss` (RFC 9207) |
| Client-Authentisierung | `client_secret_basic` |
| Scopes | `openid profile email groups` |
| Redirect-URI | `https://cockpit.rapold.io/api/auth/callback` (exakt) |
| ID-Token | Signatur über `https://auth.rapold.io/jwks.json`, `iss`, `aud = cockpit`, `exp`, `nonce` |
| Gruppen | aus dem UserInfo-Endpoint; Zugang nur mit Gruppe `admins` (änderbar über `OIDC_ALLOWED_GROUPS`) |
| Session | HttpOnly-Cookie `cockpit_session`, HS256-signiert mit `AUTH_SECRET`, 12 Stunden gültig |
| Routen | `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout` |
| Kontomenü | `<rapold-account>` aus `https://auth.rapold.io/atlas/account.js` oben rechts in der Navigation (Avatar, Dienste, Konto & Sicherheit, Abmelden); nur im privaten Modus mit OIDC, nicht bei Basic Auth |
| Abmelden | nur im Kontomenü: `/api/auth/logout` löscht `cockpit_session` und leitet direkt (`302`) auf `https://auth.rapold.io/logout?rd=https%3A%2F%2Fauth.rapold.io%2F` weiter; das beendet auch die SSO-Sitzung |
| Ohne Session | Seiten leiten zum Login weiter; API-Aufrufe erhalten `401` als JSON (keine Basic-Abfrage mehr) |
| Ausgenommen | Favicons, Manifest, `robots.txt`, `/brand/*`, `/_next/*`, `/api/cron/*` (eigenes `CRON_SECRET`) |

Code: [`middleware.ts`](../middleware.ts), [`lib/auth/`](../lib/auth),
[`app/api/auth/`](../app/api/auth). Tests: `npm run test:unit`.

## 1. Client-Secret und Digest im CT erzeugen

```bash
ssh mra-pve3 "pct exec 109 -- authelia crypto hash generate pbkdf2 --variant sha512 --random --random.length 64"
```

- *Random Password* → 1Password «OIDC cockpit», Feld `client_secret` (geht in Schritt 4 nach Vercel).
- *Digest* (`$pbkdf2-sha512$310000$…`) → in den Client-Block (Schritt 2).

## 2. Client-Block in `/etc/authelia/oidc.yml`

Gibt es `/etc/authelia/oidc.yml` im CT 109 schon, den Block unter `identity_providers.oidc.clients`
anhängen. Sonst zuerst die Vorlage `config/authelia/oidc.example.yml` aus mra-auth nach
`/etc/authelia/oidc.yml` kopieren und den Beispiel-Client durch diesen Block ersetzen.

```bash
ssh mra-pve3 "pct exec 109 -- nano /etc/authelia/oidc.yml"
```

```yaml
      - client_id: cockpit
        client_name: Cockpit
        client_secret: '<DIGEST AUS SCHRITT 1>'
        public: false
        authorization_policy: two_factor
        require_pkce: true
        pkce_challenge_method: S256
        redirect_uris:
          - https://cockpit.rapold.io/api/auth/callback
        scopes: [openid, profile, email, groups]
        grant_types: [authorization_code]
        response_types: [code]
        response_modes: [query]
        token_endpoint_auth_method: client_secret_basic
        userinfo_signed_response_alg: none
```

Hinweise:

- Die Einrückung muss zu den anderen Einträgen unter `clients:` passen (YAML).
- `userinfo_signed_response_alg: none` sorgt dafür, dass der UserInfo-Endpoint JSON liefert
  (Cockpit liest die Gruppen dort). Das ist der Authelia-Standard; die Zeile macht ihn explizit.
- Optional `consent_mode: implicit`, wenn die Einwilligungsseite beim ersten Login entfallen soll.
- Für Preview-Deployments ist bewusst keine Redirect-URI eingetragen (siehe Schritt 4).

## 3. Authelia neu laden

Entweder aus dem mra-auth-Repo:

```bash
tools/deploy.sh
```

oder direkt im CT:

```bash
ssh mra-pve3 "pct exec 109 -- bash /opt/mra-auth/ct/install.sh"
```

Kontrolle:

```bash
ssh mra-pve3 "pct exec 109 -- journalctl -u authelia -n 30 --no-pager"
curl -s https://auth.rapold.io/.well-known/openid-configuration | head -c 200
```

Das Journal darf keine Konfigurationsfehler zum Client `cockpit` zeigen.

## 4. Vercel-Umgebungsvariablen setzen

Im Repo-Verzeichnis (das Projekt ist über `.vercel/project.json` verknüpft, Vercel-Projekt
`cockpit`, Scope `marcelrapold`). Die Werte nicht in die Shell-History schreiben: Die
Befehle fragen interaktiv nach dem Wert, wenn kein `--value` angegeben ist.

`AUTH_SECRET` einmalig erzeugen und in 1Password («OIDC cockpit», Feld `AUTH_SECRET`) ablegen:

```bash
openssl rand -base64 48
```

Production:

```bash
vercel env add OIDC_ISSUER production --value https://auth.rapold.io --no-sensitive
vercel env add OIDC_CLIENT_ID production --value cockpit --no-sensitive
vercel env add AUTH_URL production --value https://cockpit.rapold.io --no-sensitive
vercel env add OIDC_CLIENT_SECRET production --sensitive   # Wert: client_secret aus 1Password
vercel env add AUTH_SECRET production --sensitive          # Wert: AUTH_SECRET aus 1Password
```

Preview (gleiche Werte):

```bash
vercel env add OIDC_ISSUER preview --value https://auth.rapold.io --no-sensitive
vercel env add OIDC_CLIENT_ID preview --value cockpit --no-sensitive
vercel env add AUTH_URL preview --value https://cockpit.rapold.io --no-sensitive
vercel env add OIDC_CLIENT_SECRET preview --sensitive
vercel env add AUTH_SECRET preview --sensitive
```

Fragt die CLI bei Preview nach einem Git-Branch, leer lassen (gilt dann für alle Preview-Branches).

Zu Preview: Previews laufen heute im öffentlichen Modus (`COCKPIT_EXPOSURE_MODE` ist nur für
Production gesetzt), dort hat der Login also keine Wirkung. Wird eine Preview später privat
geschaltet, führt `AUTH_URL` den Login über die Produktions-Callback-URL; die Session gilt
dann für `cockpit.rapold.io`, nicht für die Preview-Adresse.

Optional: `OIDC_ALLOWED_GROUPS` (Komma-Liste, Standard `admins`).

Kontrolle (zeigt nur Namen, keine Werte):

```bash
vercel env ls
```

## 5. Redeploy

Env-Variablen wirken erst im nächsten Deployment:

```bash
vercel redeploy cockpit.rapold.io --target production
```

Alternativ im Vercel-Dashboard beim letzten Production-Deployment «Redeploy» wählen, oder einen
Commit auf `main` pushen.

## 6. Testen

1. Ohne Session: `curl -sI https://cockpit.rapold.io/` → `302`, `location: /api/auth/login?returnTo=%2F`
   (kein `WWW-Authenticate: Basic` mehr).
2. `curl -sI https://cockpit.rapold.io/api/auth/login` → `302` auf
   `https://auth.rapold.io/api/oidc/authorization?…&redirect_uri=https%3A%2F%2Fcockpit.rapold.io%2Fapi%2Fauth%2Fcallback&…&code_challenge_method=S256`.
3. API ohne Session: `curl -s https://cockpit.rapold.io/api/summary` → `401` mit JSON-Fehler.
4. Öffentlich bleiben: `curl -sI https://cockpit.rapold.io/favicon.svg` und `/manifest.json` → `200`.
5. Im Browser (privates Fenster) `https://cockpit.rapold.io/lunar` öffnen → Anmeldung bei
   auth.rapold.io mit Passwort und zweitem Faktor → zurück auf `/lunar`, Dashboard im privaten
   Modus, oben rechts das Kontomenü mit Avatar und Namen.
6. Kontomenü → «Abmelden» → direkt weiter zu auth.rapold.io, Startseite dort ohne Anmeldung.
   `curl -sI https://cockpit.rapold.io/api/auth/logout` → `302`, `location:
   https://auth.rapold.io/logout?rd=https%3A%2F%2Fauth.rapold.io%2F`, `set-cookie: cockpit_session=; Max-Age=0`.
   Erneuter Aufruf von Cockpit verlangt wieder Passwort und zweiten Faktor.
7. Gegenprobe ohne Gruppe `admins` (falls ein Testkonto existiert): Seite «Kein Zugriff», `403`.

Fehlerbilder:

| Meldung | Ursache |
|---|---|
| Authelia: «invalid redirect uri» | `redirect_uris` in `oidc.yml` stimmt nicht exakt mit `AUTH_URL` + `/api/auth/callback` überein |
| Cockpit: «Anmeldung fehlgeschlagen» | Secret falsch (Vercel-Log: `Token-Endpoint antwortete mit 401`) oder UserInfo nicht als JSON |
| Cockpit: «Kein Zugriff» | Konto nicht in Gruppe `admins` bzw. Scope `groups` fehlt im Client |
| Kein Kontomenü sichtbar | Basic-Auth-Modus (gewollt), oder `account.js` blockiert (Browser-Konsole); die Seiten sind statisch, nach Env-Änderungen braucht es ein Redeploy |
| Endlosschleife zum Login | `AUTH_SECRET` zwischen Deployments geändert oder Cookies blockiert |

## Rückfall

Basic Auth ist sofort wieder aktiv, sobald **eine** der vier Variablen fehlt:

```bash
vercel env rm OIDC_CLIENT_SECRET production --yes
vercel redeploy cockpit.rapold.io --target production
```

`COCKPIT_PRIVATE_BASIC_AUTH` bleibt dafür in Production gesetzt; erst entfernen, wenn der
OIDC-Login eine Weile stabil läuft. Kontrolle nach dem Rückfall:
`curl -sI https://cockpit.rapold.io/` → `401` mit `WWW-Authenticate: Basic realm="Cockpit Private"`.

Den Client in Authelia muss man für den Rückfall nicht entfernen.
