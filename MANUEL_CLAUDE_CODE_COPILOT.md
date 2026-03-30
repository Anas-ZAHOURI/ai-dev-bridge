# Manuel d'utilisation : Claude Code via GitHub Copilot / Gemini Code Assist

> **Contexte** : Vous êtes sur un PC de dev entreprise qui autorise uniquement GitHub Copilot
> et/ou Google Gemini Code Assist.
> Ce guide vous permet d'utiliser **Claude Code** en passant par votre licence existante,
> grace a un proxy local qui traduit les requêtes entre les API.

---

## Comment ça marche ?

```
                                                  ┌─────────────────────┐
                                              ┌──>│  API GitHub Copilot  │
┌──────────────┐     Format Anthropic     ┌───┴───────────────┐         │
│  Claude Code │  ─────────────────────>  │  Proxy local      │         │
│  (terminal)  │    POST /v1/messages     │  (Node/Python)    │         │
│              │  <─────────────────────  │  localhost:4141    │         │
└──────────────┘     Reponse Anthropic    └───┬───────────────┘         │
                                              └──>│  API Gemini (Google) │
                                                  └─────────────────────┘
```

Le proxy intercepte les appels de Claude Code (format Anthropic), les convertit au format
du fournisseur cible (Copilot/OpenAI ou Gemini/Google), envoie la requête, puis retraduit
la réponse pour Claude Code.

**Deux fournisseurs supportés :**
- **GitHub Copilot** : via les proxies dédiés (copilot-api, copilot-proxy, etc.) ou LiteLLM
- **Google Gemini Code Assist** : via LiteLLM avec authentification Google Cloud

---

## Prerequis communs

- **Node.js** >= 18 installe (vérifiez avec `node --version`)
- **Au moins un fournisseur actif** :
  - **GitHub Copilot** actif sur votre compte GitHub (Individual, Business ou Enterprise)
  - ET/OU **Google Gemini Code Assist** avec accès a Google Cloud (API key ou `gcloud` CLI)
- **Claude Code** installe :
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

---

# MÉTHODE 1 : Installation via npm/npx (rapide)

## Option A : copilot-api (le plus populaire)

**Repo** : https://github.com/ericc-ch/copilot-api

### Étape 1 : Lancer le proxy

```bash
# Méthode rapide avec npx (rien a installer)
npx copilot-api@latest start --claude-code
```

Ou installation globale :
```bash
npm install -g copilot-api
copilot-api start --claude-code
```

### Étape 2 : Authentification

Au premier lancement, le proxy affiche un **code d'appareil** et ouvre votre navigateur.
1. Connectez-vous a GitHub
2. Entrez le code affiche dans le terminal
3. Autorisez l'application

### Étape 3 : Selection des modèles

Le flag `--claude-code` vous demande de choisir :
- Un **modèle principal** (ex: `gpt-5.4`, `claude-sonnet-4.6`)
- Un **modèle rapide** (ex: `gpt-5.4-mini`)

Une commande de lancement est **copiée dans votre presse-papier**. Collez-la dans un 2e terminal.

### Étape 4 : Configuration manuelle (alternative)

Si vous preferez configurer manuellement, créez/editez le fichier `.claude/settings.json`
dans votre home ou votre projet :

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-5.4",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-5.4-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "deny": ["WebSearch"]
  }
}
```

Puis lancez :
```bash
# Terminal 1 : proxy
npx copilot-api@latest start

# Terminal 2 : Claude Code
claude
```

### Options utiles de copilot-api

| Flag | Description |
|------|-------------|
| `--port 4141` | Port du proxy (défaut: 4141) |
| `--account-type business` | Type de compte : `individual`, `business`, `enterprise` |
| `--rate-limit 30` | Délai minimum (secondes) entre les requêtes |
| `--wait` | Attendre au lieu d'erreur si rate-limit atteint |
| `--verbose` | Logs détaillés |
| `--proxy-env` | Utiliser HTTP_PROXY/HTTPS_PROXY du système |

### Commandes supplémentaires

```bash
npx copilot-api@latest auth           # Authentification seule
npx copilot-api@latest check-usage    # Voir le quota restant
npx copilot-api@latest debug          # Diagnostic
```

---

## Option B : copilot-proxy (fork avec mode daemon)

**Repo** : https://github.com/Jer-y/copilot-proxy

```bash
# Lancement rapide
npx @jer-y/copilot-proxy@latest start --claude-code

# Ou installation globale
npm install -g @jer-y/copilot-proxy
copilot-proxy start --claude-code
```

**Port par défaut** : 4399

### Avantage : mode daemon (arrière-plan)

```bash
copilot-proxy start -d       # Demarrer en arrière-plan
copilot-proxy status          # Voir le statut
copilot-proxy logs            # Voir les logs
copilot-proxy stop            # Arrêter
copilot-proxy restart         # Redémarrer
copilot-proxy enable          # Auto-démarrage au boot
copilot-proxy disable         # Désactiver l'auto-démarrage
```

Configuration `.claude/settings.json` :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4399",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-5.4",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-5.4-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

---

## Option C : LM Proxy (extension VS Code)

**Repo** : https://github.com/ryonakae/vscode-lm-proxy
**Marketplace** : cherchez "LM Proxy" dans les extensions VS Code

1. Installez l'extension dans VS Code
2. Elle utilise l'authentification Copilot déjà presente dans VS Code
3. Lancez Claude Code avec :

```bash
ANTHROPIC_BASE_URL=http://localhost:4000/anthropic/claude claude
```

> **Avantage** : Pas besoin d'authentification séparée, utilise directement celle de VS Code.
> **Inconvénient** : VS Code doit rester ouvert.

---

# MÉTHODE 2 : Cloner les projets et les démarrer à la main

Pour un controle total ou si npx est bloqué par votre proxy entreprise.

## Projet A : copilot-api (Node.js)

```bash
# 1. Cloner
git clone https://github.com/ericc-ch/copilot-api.git
cd copilot-api

# 2. Installer les dépendances
npm install

# 3. Builder le projet
npm run build

# 4. Lancer
node dist/index.js start --claude-code

# Ou sans le mode claude-code :
node dist/index.js start --port 4141 --verbose
```

---

## Projet B : claude-code-copilot (Node.js pur, zero dépendance externe)

**Repo** : https://github.com/samarth777/claude-code-copilot

```bash
# 1. Cloner
git clone https://github.com/samarth777/claude-code-copilot.git
cd claude-code-copilot

# 2. Authentification (ouvre le navigateur pour le device flow GitHub)
node scripts/auth.mjs

# 3. Lancer le proxy + Claude Code d'un coup
bash scripts/launch.sh

# Ou manuellement :
# Terminal 1 : proxy (port 18080 par défaut)
node src/proxy.mjs

# Terminal 2 : Claude Code
ANTHROPIC_BASE_URL=http://localhost:18080 ANTHROPIC_API_KEY=copilot-proxy claude
```

**Variables d'environnement optionnelles** :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `COPILOT_PROXY_PORT` | 18080 | Port du proxy |
| `COPILOT_AUTH_FILE` | ~/.claude-copilot-auth.json | Fichier token OAuth |
| `BRAVE_API_KEY` | (aucun) | Cle Brave Search (recherche web) |

> **Bonus** : Ce projet inclut une recherche web intégrée (DuckDuckGo gratuit ou Brave Search).

---

## Projet C : copilot-proxy de Jer-y (Node.js, daemon)

```bash
# 1. Cloner
git clone https://github.com/Jer-y/copilot-proxy.git
cd copilot-proxy

# 2. Installer
npm install

# 3. Builder
npm run build

# 4. Lancer
node dist/index.js start --claude-code --port 4399
```

---

## Projet D : claude-copilot-proxy (Go)

**Repo** : https://github.com/acheong08/claude-copilot-proxy

> Nécessite Go installé (`go version`)

```bash
# 1. Cloner
git clone https://github.com/acheong08/claude-copilot-proxy.git
cd claude-copilot-proxy

# 2. Obtenir un token Copilot (via un des autres outils ou manuellement)
export COPILOT_API_KEY="ghu_votre_token_ici"

# 3. Lancer
go run ./cmd/proxy/

# 4. Dans un autre terminal
ANTHROPIC_BASE_URL=http://localhost:8082 ANTHROPIC_API_KEY=copilot-proxy claude
```

---

## Projet E : cc-copilot-bridge (multi-provider)

**Repo** : https://github.com/FlorianBruniaux/cc-copilot-bridge

> Routeur multi-provider : basculez entre Copilot, Anthropic Direct et Ollama local.

```bash
# Installer via Homebrew
brew tap FlorianBruniaux/tap
brew install cc-copilot-bridge
eval "$(claude-switch --shell-config)"

# Ou via script
curl -fsSL https://raw.githubusercontent.com/FlorianBruniaux/cc-copilot-bridge/main/install.sh | bash
```

```bash
# Utilisation : aliases simples
ccc    # Claude Code via Copilot (copilot-api doit tourner)
ccd    # Claude Code via API Anthropic directe
cco    # Claude Code via Ollama (offline)

# Changer de modèle
COPILOT_MODEL=claude-opus-4.6 ccc
COPILOT_MODEL=gpt-5.4 ccc

# Vérifier les providers
ccs
```

**Points forts** : 40+ modèles, health checks, profils MCP auto, injection d'identité modèle, logging sessions.

---

## Projet F : copilot-api fork Anthropic-first

**Repo** : https://github.com/caozhiyuan/copilot-api (branche `all`)

> Fork amélioré de copilot-api avec routage natif Messages API pour Claude.

```bash
# Identique à copilot-api mais avec le fork
npx @jeffreycao/copilot-api@latest start --claude-code
```

**Avantages vs l'original** :
- **API Anthropic native** : préserve tool_use/tool_result et thinking
- **Token counting exact** : via endpoint Anthropic (pas estimation GPT)
- **Optimisation quota** : warmup via smallModel, continuation de sessions
- **Sous-agents** : support des markers Claude Code

Recommandé si vous utilisez principalement des modèles Claude via Copilot.

---

## Projet G : LiteLLM (Python, le plus flexible)

LiteLLM supporte **tous les fournisseurs** : GitHub Copilot, Gemini Code Assist, et bien d'autres.

```bash
# 1. Installer
pip install litellm[proxy]

# 2. Créer le fichier de config (choisissez votre fournisseur ci-dessous)
```

### Config pour GitHub Copilot (`copilot-config.yaml`) :
```yaml
model_list:
  - model_name: claude-sonnet-4.6
    litellm_params:
      model: github_copilot/claude-sonnet-4.6
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"
  - model_name: gpt-5.4
    litellm_params:
      model: github_copilot/gpt-5.4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

litellm_settings:
  drop_params: true
```

### Config pour Gemini Code Assist (`gemini-config.yaml`) :
```yaml
model_list:
  # Modèle principal — Gemini 2.5 Pro (raisonnement avancé, code)
  - model_name: gemini-2.5-pro
    litellm_params:
      model: gemini/gemini-2.5-pro
  # Modèle rapide — Gemini 2.5 Flash (rapide, économique)
  - model_name: gemini-2.5-flash
    litellm_params:
      model: gemini/gemini-2.5-flash
  # Alternative : Gemini 2.0 Flash (très rapide)
  - model_name: gemini-2.0-flash
    litellm_params:
      model: gemini/gemini-2.0-flash

litellm_settings:
  drop_params: true
```

### Config mixte Copilot + Gemini (`mixed-config.yaml`) :
```yaml
model_list:
  # GitHub Copilot
  - model_name: gpt-5.4
    litellm_params:
      model: github_copilot/gpt-5.4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"
  - model_name: claude-sonnet-4.6
    litellm_params:
      model: github_copilot/claude-sonnet-4.6
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"
  # Google Gemini
  - model_name: gemini-2.5-pro
    litellm_params:
      model: gemini/gemini-2.5-pro
  - model_name: gemini-2.5-flash
    litellm_params:
      model: gemini/gemini-2.5-flash

litellm_settings:
  drop_params: true
```

> **IMPORTANT** : `drop_params: true` est obligatoire, sinon le paramètre `thinking`
> envoyé par Claude Code provoque une erreur.

**Authentification Gemini** : deux options :
```bash
# Option A : clé API Google AI Studio (le plus simple)
export GEMINI_API_KEY=AIzaSy...votre_cle

# Option B : gcloud CLI (pour Gemini via Vertex AI en entreprise)
gcloud auth application-default login
```

```bash
# 3. Lancer (choisissez le fichier config selon votre fournisseur)
litellm --config copilot-config.yaml    # GitHub Copilot
litellm --config gemini-config.yaml     # Gemini Code Assist
litellm --config mixed-config.yaml      # Les deux !

# 4. Configurer Claude Code (.claude/settings.json)
```

### settings.json pour Copilot via LiteLLM :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "github_copilot/claude-sonnet-4.6",
    "ANTHROPIC_SMALL_FAST_MODEL": "github_copilot/gpt-5.4",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### settings.json pour Gemini Code Assist via LiteLLM :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "gemini-2.5-pro",
    "ANTHROPIC_SMALL_FAST_MODEL": "gemini-2.5-flash",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

---

# Référence des variables d'environnement

| Variable | Role | Exemple Copilot | Exemple Gemini |
|----------|------|-----------------|----------------|
| `ANTHROPIC_BASE_URL` | URL du proxy local | `http://localhost:4141` | `http://localhost:4000` |
| `ANTHROPIC_AUTH_TOKEN` | Token (valeur bidon acceptee) | `dummy` | `dummy` ou `sk-litellm-static-key` |
| `ANTHROPIC_API_KEY` | Alternative a AUTH_TOKEN | `copilot-proxy` | `sk-litellm-static-key` |
| `ANTHROPIC_MODEL` | Modèle principal | `gpt-5.4`, `claude-sonnet-4.6` | `gemini-2.5-pro` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Modèle rapide/léger | `gpt-5.4-mini` | `gemini-2.5-flash` |
| `GEMINI_API_KEY` | Clé API Google AI Studio | — | `AIzaSy...` |
| `DISABLE_NON_ESSENTIAL_MODEL_CALLS` | Réduit les appels inutiles | `1` | `1` |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Réduit encore plus le trafic | `1` | `1` |

---

# Conseils et pieges a eviter

### 1. Consommation de quota elevee
Claude Code consomme **10 a 100x plus de tokens** qu'un chat Copilot classique.
Une seule commande "edite ce fichier" peut consommer 50 000 a 150 000 tokens.
- Activez `DISABLE_NON_ESSENTIAL_MODEL_CALLS=1`
- Utilisez `--rate-limit 30 --wait` pour espacer les requêtes

### 2. Erreur "thinking parameter"
Claude Code envoie un paramètre `thinking` que Copilot ne supporté pas.
- Les proxies Node.js (copilot-api, copilot-proxy) gèrent ca automatiquement
- Avec LiteLLM, mettez `drop_params: true` dans la config

### 3. Recherche web qui échoue
Claude Code tente des recherches web qui ne passent pas par Copilot.
- Ajoutez `"deny": ["WebSearch"]` dans vos permissions
- Ou utilisez claude-code-copilot qui a sa propre recherche web intégrée

### 4. Proxy entreprise
Si vous êtes derrière un proxy HTTP d'entreprise :
```bash
# Pour copilot-api
npx copilot-api@latest start --proxy-env

# Ou definissez les variables avant de lancer
export HTTP_PROXY=http://proxy.entreprise.fr:8080
export HTTPS_PROXY=http://proxy.entreprise.fr:8080
export NO_PROXY=localhost,127.0.0.1
```

**Authentification NTLM/Kerberos** : installez [Cntlm](https://cntlm.sourceforge.net/) comme relais local, puis pointez `HTTP_PROXY` vers `http://127.0.0.1:3128`.

**Certificats SSL auto-signés** (erreur `UNABLE_TO_VERIFY_LEAF_SIGNATURE`) :
```bash
# Ajouter le certificat racine de l'entreprise
export NODE_EXTRA_CA_CERTS=/chemin/vers/cert-entreprise.pem

# Python (LiteLLM)
export REQUESTS_CA_BUNDLE=/chemin/vers/cert-entreprise.pem

# Solution temporaire (dev uniquement !)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Windows (PowerShell)** :
```powershell
$env:HTTP_PROXY = "http://proxy.entreprise.fr:8080"
$env:HTTPS_PROXY = "http://proxy.entreprise.fr:8080"
$env:NODE_EXTRA_CA_CERTS = "C:\Certificats\ca-entreprise.pem"
```

**WSL2** : le proxy Windows n'est pas hérité automatiquement :
```bash
WIN_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
export HTTP_PROXY=http://${WIN_HOST}:3128
export HTTPS_PROXY=http://${WIN_HOST}:3128
```

**Domaines à whitelister** (firewall) :

*GitHub Copilot :*
- `github.com` / `api.github.com` (port 443)
- `api.individual.githubcopilot.com` (port 443)
- `copilot-proxy.githubusercontent.com` (port 443)
- `registry.npmjs.org` (port 443)

*Google Gemini Code Assist :*
- `generativelanguage.googleapis.com` (port 443)
- `aiplatform.googleapis.com` (port 443 — Vertex AI)
- `oauth2.googleapis.com` (port 443 — authentification)

*Commun :*
- `localhost:4141` (proxy local — ne pas bloquer)

**Chaîne de proxys** : seul copilot-api passe par le proxy corporate. Claude Code pointe vers `localhost:4141` uniquement.

**Diagnostic** :
```bash
curl -v --proxy http://proxy.entreprise.fr:8080 https://api.github.com/zen
curl http://localhost:4141/v1/models
env | grep -i proxy
```

### 5. Intégration officielle Claude/Copilot (février 2026)
GitHub a lancé Claude et Codex officiellement comme agents de codage pour **Copilot Business et Pro**.
Si votre entreprise dispose de Copilot Business/Pro, vérifiez d'abord si l'intégration native
couvre votre besoin avant d'utiliser un proxy non-officiel.
Voir : https://github.blog/changelog/2026-02-26-claude-and-codex-now-available-for-copilot-business-pro-users/

### 6. Risque sur le compte
Ces outils utilisent des API **non-officielles** de GitHub Copilot.
Une utilisation excessive peut déclencher une detection d'abus.
- Utilisez le rate-limiting
- Évitez les sessions tres longues sans pause

### 7. Noms de modèles
Meme si Claude Code pense parler à l'API Anthropic, vous specifiez des noms
de modèles **Copilot** (ex: `gpt-5.4`) ou **Gemini** (ex: `gemini-2.5-pro`). Le proxy traduit tout.

---

# Modèles disponibles par fournisseur

| Modèle | Fournisseur | Forces | Recommandation |
|--------|-------------|--------|----------------|
| `gpt-5.4` | GitHub Copilot (OpenAI) | Polyvalent, bon en code | Principal Copilot |
| `gpt-5.4-mini` | GitHub Copilot (OpenAI) | Rapide, economique | Rapide Copilot |
| `claude-sonnet-4.6` | GitHub Copilot (Anthropic) | Excellent en code | Principal qualité |
| `claude-opus-4.6` | GitHub Copilot (Anthropic) | Le plus puissant | Taches complexes |
| `gemini-2.5-pro` | Gemini Code Assist | Raisonnement avancé, code, contexte 1M | Principal Gemini |
| `gemini-2.5-flash` | Gemini Code Assist | Très rapide, multimodal | Rapide Gemini |
| `gemini-2.0-flash` | Gemini Code Assist | Ultra rapide, low latency | Taches simples Gemini |

---

# Tableau comparatif

| Projet | Langage | Install rapide | Fournisseurs supportés | Daemon | Auth auto | Port défaut | Spécificité |
|--------|---------|---------------|----------------------|--------|-----------|-------------|-------------|
| copilot-api | Node.js | `npx copilot-api@latest` | Copilot | Non | Oui | 4141 | Le plus populaire |
| copilot-proxy (Jer-y) | Node.js | `npx @jer-y/copilot-proxy@latest` | Copilot | Oui | Oui | 4399 | Mode daemon |
| claude-code-copilot | Node.js | Non (clone) | Copilot | Non | Oui | 18080 | Recherche web intégrée |
| claude-copilot-proxy | Go | Non (clone) | Copilot | Non | Manuel | 8082 | Léger, un binaire |
| cc-copilot-bridge | Bash | Homebrew / script | Copilot + Ollama | Non | Via backend | Via backend | **Multi-provider** |
| copilot-api fork | Node.js | `npx @jeffreycao/copilot-api@latest` | Copilot | Non | Oui | 4141 | **API Anthropic native** |
| LM Proxy | VS Code ext | Non | Copilot | Non | Via VS Code | 4000 | Pas de terminal |
| **LiteLLM** | **Python** | **Non (pip)** | **Copilot + Gemini + 100+** | Non | Via config | 4000 | **Dashboard web, multi-provider** |

---

# Démarrage rapide (TL;DR)

### Le plus simple (2 commandes) :
```bash
# Terminal 1
npx copilot-api@latest start --claude-code

# Terminal 2 : collez la commande copiée dans le presse-papier
```

### Le plus robuste pour entreprise :
```bash
# Installer en global + daemon
npm install -g @jer-y/copilot-proxy
copilot-proxy start --claude-code -d
copilot-proxy enable   # auto-démarrage au boot
```

### Le plus flexible (Python, Copilot ou Gemini) :
```bash
pip install litellm[proxy]

# Via GitHub Copilot :
litellm --config copilot-config.yaml

# Via Gemini Code Assist :
export GEMINI_API_KEY=AIzaSy...votre_cle
litellm --config gemini-config.yaml

# Puis configurez .claude/settings.json
```
