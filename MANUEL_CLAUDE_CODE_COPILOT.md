# Manuel d'utilisation : Claude Code via GitHub Copilot

> **Contexte** : Vous etes sur un PC de dev entreprise qui autorise uniquement GitHub Copilot.
> Ce guide vous permet d'utiliser **Claude Code** en passant par votre licence Copilot existante,
> grace a un proxy local qui traduit les requetes entre les deux API.

---

## Comment ca marche ?

```
Claude Code  --->  Proxy local (localhost)  --->  API GitHub Copilot
  (format Anthropic)    (traduction)              (format OpenAI)
```

Le proxy intercepte les appels de Claude Code (format Anthropic), les convertit au format
Copilot/OpenAI, envoie la requete a GitHub, puis retraduit la reponse pour Claude Code.

---

## Prerequis communs

- **Node.js** >= 18 installe (verifiez avec `node --version`)
- **GitHub Copilot** actif sur votre compte GitHub (Individual, Business ou Enterprise)
- **Claude Code** installe :
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

---

# METHODE 1 : Installation via npm/npx (rapide)

## Option A : copilot-api (le plus populaire)

**Repo** : https://github.com/ericc-ch/copilot-api

### Etape 1 : Lancer le proxy

```bash
# Methode rapide avec npx (rien a installer)
npx copilot-api@latest start --claude-code
```

Ou installation globale :
```bash
npm install -g copilot-api
copilot-api start --claude-code
```

### Etape 2 : Authentification

Au premier lancement, le proxy affiche un **code d'appareil** et ouvre votre navigateur.
1. Connectez-vous a GitHub
2. Entrez le code affiche dans le terminal
3. Autorisez l'application

### Etape 3 : Selection des modeles

Le flag `--claude-code` vous demande de choisir :
- Un **modele principal** (ex: `gpt-4.1`, `claude-sonnet-4`)
- Un **modele rapide** (ex: `gpt-4.1-mini`)

Une commande de lancement est **copiee dans votre presse-papier**. Collez-la dans un 2e terminal.

### Etape 4 : Configuration manuelle (alternative)

Si vous preferez configurer manuellement, creez/editez le fichier `.claude/settings.json`
dans votre home ou votre projet :

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-4.1",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-4.1-mini",
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
| `--port 4141` | Port du proxy (defaut: 4141) |
| `--account-type business` | Type de compte : `individual`, `business`, `enterprise` |
| `--rate-limit 30` | Delai minimum (secondes) entre les requetes |
| `--wait` | Attendre au lieu d'erreur si rate-limit atteint |
| `--verbose` | Logs detailles |
| `--proxy-env` | Utiliser HTTP_PROXY/HTTPS_PROXY du systeme |

### Commandes supplementaires

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

**Port par defaut** : 4399

### Avantage : mode daemon (arriere-plan)

```bash
copilot-proxy start -d       # Demarrer en arriere-plan
copilot-proxy status          # Voir le statut
copilot-proxy logs            # Voir les logs
copilot-proxy stop            # Arreter
copilot-proxy restart         # Redemarrer
copilot-proxy enable          # Auto-demarrage au boot
copilot-proxy disable         # Desactiver l'auto-demarrage
```

Configuration `.claude/settings.json` :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4399",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-4.1",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-4.1-mini",
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
2. Elle utilise l'authentification Copilot deja presente dans VS Code
3. Lancez Claude Code avec :

```bash
ANTHROPIC_BASE_URL=http://localhost:4000/anthropic/claude claude
```

> **Avantage** : Pas besoin d'authentification separee, utilise directement celle de VS Code.
> **Inconvenient** : VS Code doit rester ouvert.

---

# METHODE 2 : Cloner les projets et les demarrer a la main

Pour un controle total ou si npx est bloque par votre proxy entreprise.

## Projet A : copilot-api (Node.js)

```bash
# 1. Cloner
git clone https://github.com/ericc-ch/copilot-api.git
cd copilot-api

# 2. Installer les dependances
npm install

# 3. Builder le projet
npm run build

# 4. Lancer
node dist/index.js start --claude-code

# Ou sans le mode claude-code :
node dist/index.js start --port 4141 --verbose
```

---

## Projet B : claude-code-copilot (Node.js pur, zero dependance externe)

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
# Terminal 1 : proxy (port 18080 par defaut)
node src/proxy.mjs

# Terminal 2 : Claude Code
ANTHROPIC_BASE_URL=http://localhost:18080 ANTHROPIC_API_KEY=copilot-proxy claude
```

**Variables d'environnement optionnelles** :

| Variable | Defaut | Description |
|----------|--------|-------------|
| `COPILOT_PROXY_PORT` | 18080 | Port du proxy |
| `COPILOT_AUTH_FILE` | ~/.claude-copilot-auth.json | Fichier token OAuth |
| `BRAVE_API_KEY` | (aucun) | Cle Brave Search (recherche web) |

> **Bonus** : Ce projet inclut une recherche web integree (DuckDuckGo gratuit ou Brave Search).

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

> Necessite Go installe (`go version`)

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

## Projet E : LiteLLM (Python, le plus flexible)

```bash
# 1. Installer
pip install 'litellm[proxy]'

# 2. Creer le fichier de config copilot-config.yaml :
```

Contenu de `copilot-config.yaml` :
```yaml
model_list:
  - model_name: claude-sonnet-4
    litellm_params:
      model: github_copilot/claude-sonnet-4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"
  - model_name: gpt-4.1
    litellm_params:
      model: github_copilot/gpt-4.1
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

litellm_settings:
  drop_params: true
```

> **IMPORTANT** : `drop_params: true` est obligatoire, sinon le parametre `thinking`
> envoye par Claude Code provoque une erreur.

```bash
# 3. Lancer
litellm --config copilot-config.yaml

# 4. Configurer Claude Code (.claude/settings.json)
```

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "github_copilot/claude-sonnet-4",
    "ANTHROPIC_SMALL_FAST_MODEL": "github_copilot/gpt-4.1",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

---

# Reference des variables d'environnement

| Variable | Role | Exemple |
|----------|------|---------|
| `ANTHROPIC_BASE_URL` | URL du proxy local | `http://localhost:4141` |
| `ANTHROPIC_AUTH_TOKEN` | Token (valeur bidon acceptee) | `dummy` |
| `ANTHROPIC_API_KEY` | Alternative a AUTH_TOKEN | `copilot-proxy` |
| `ANTHROPIC_MODEL` | Modele principal | `gpt-4.1`, `claude-sonnet-4` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Modele rapide/leger | `gpt-4.1-mini` |
| `DISABLE_NON_ESSENTIAL_MODEL_CALLS` | Reduit les appels inutiles | `1` |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Reduit encore plus le trafic | `1` |

---

# Conseils et pieges a eviter

### 1. Consommation de quota elevee
Claude Code consomme **10 a 100x plus de tokens** qu'un chat Copilot classique.
Une seule commande "edite ce fichier" peut consommer 50 000 a 150 000 tokens.
- Activez `DISABLE_NON_ESSENTIAL_MODEL_CALLS=1`
- Utilisez `--rate-limit 30 --wait` pour espacer les requetes

### 2. Erreur "thinking parameter"
Claude Code envoie un parametre `thinking` que Copilot ne supporte pas.
- Les proxies Node.js (copilot-api, copilot-proxy) gerent ca automatiquement
- Avec LiteLLM, mettez `drop_params: true` dans la config

### 3. Recherche web qui echoue
Claude Code tente des recherches web qui ne passent pas par Copilot.
- Ajoutez `"deny": ["WebSearch"]` dans vos permissions
- Ou utilisez claude-code-copilot qui a sa propre recherche web integree

### 4. Proxy entreprise
Si vous etes derriere un proxy HTTP d'entreprise :
```bash
# Pour copilot-api
npx copilot-api@latest start --proxy-env

# Ou definissez les variables avant de lancer
export HTTP_PROXY=http://proxy.entreprise.fr:8080
export HTTPS_PROXY=http://proxy.entreprise.fr:8080
```

### 5. Risque sur le compte
Ces outils utilisent des API **non-officielles** de GitHub Copilot.
Une utilisation excessive peut declencher une detection d'abus.
- Utilisez le rate-limiting
- Evitez les sessions tres longues sans pause

### 6. Noms de modeles
Meme si Claude Code pense parler a l'API Anthropic, vous specifiez des noms
de modeles **Copilot** (ex: `gpt-4.1`). Le proxy traduit tout.

---

# Tableau comparatif

| Projet | Langage | Install npx | Daemon | Auth auto | Port defaut |
|--------|---------|-------------|--------|-----------|-------------|
| copilot-api | Node.js | `npx copilot-api@latest` | Non | Oui | 4141 |
| copilot-proxy (Jer-y) | Node.js | `npx @jer-y/copilot-proxy@latest` | Oui | Oui | 4399 |
| claude-code-copilot | Node.js | Non (clone) | Non | Oui | 18080 |
| claude-copilot-proxy | Go | Non (clone) | Non | Manuel | 8082 |
| LM Proxy | VS Code ext | Non | Non | Via VS Code | 4000 |
| LiteLLM | Python | Non (pip) | Non | Via config | 4000 |

---

# Demarrage rapide (TL;DR)

### Le plus simple (2 commandes) :
```bash
# Terminal 1
npx copilot-api@latest start --claude-code

# Terminal 2 : collez la commande copiee dans le presse-papier
```

### Le plus robuste pour entreprise :
```bash
# Installer en global + daemon
npm install -g @jer-y/copilot-proxy
copilot-proxy start --claude-code -d
copilot-proxy enable   # auto-demarrage au boot
```

### Le plus flexible (Python) :
```bash
pip install 'litellm[proxy]'
litellm --config copilot-config.yaml
# Puis configurez .claude/settings.json
```
