# Manuel d'utilisation : Claude Code via GitHub Copilot

> **Contexte** : Vous êtes sur un PC de dev entreprise qui autorise uniquement GitHub Copilot.
> Ce guide vous permet d'utiliser **Claude Code** en passant par votre licence Copilot existante,
> grace a un proxy local qui traduit les requêtes entre les deux API.

---

## Comment ça marche ?

```
Claude Code  --->  Proxy local (localhost)  --->  API GitHub Copilot
  (format Anthropic)    (traduction)              (format OpenAI)
```

Le proxy intercepte les appels de Claude Code (format Anthropic), les convertit au format
Copilot/OpenAI, envoie la requête a GitHub, puis retraduit la réponse pour Claude Code.

---

## Prerequis communs

- **Node.js** >= 18 installe (vérifiez avec `node --version`)
- **GitHub Copilot** actif sur votre compte GitHub (Individual, Business ou Enterprise)
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

## Projet E : LiteLLM (Python, le plus flexible)

```bash
# 1. Installer
pip install 'litellm[proxy]'

# 2. Créer le fichier de config copilot-config.yaml :
```

Contenu de `copilot-config.yaml` :
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

> **IMPORTANT** : `drop_params: true` est obligatoire, sinon le paramètre `thinking`
> envoyé par Claude Code provoque une erreur.

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
    "ANTHROPIC_MODEL": "github_copilot/claude-sonnet-4.6",
    "ANTHROPIC_SMALL_FAST_MODEL": "github_copilot/gpt-5.4",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

---

# Référence des variables d'environnement

| Variable | Role | Exemple |
|----------|------|---------|
| `ANTHROPIC_BASE_URL` | URL du proxy local | `http://localhost:4141` |
| `ANTHROPIC_AUTH_TOKEN` | Token (valeur bidon acceptee) | `dummy` |
| `ANTHROPIC_API_KEY` | Alternative a AUTH_TOKEN | `copilot-proxy` |
| `ANTHROPIC_MODEL` | Modèle principal | `gpt-5.4`, `claude-sonnet-4.6` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Modèle rapide/léger | `gpt-5.4-mini` |
| `DISABLE_NON_ESSENTIAL_MODEL_CALLS` | Réduit les appels inutiles | `1` |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Réduit encore plus le trafic | `1` |

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
- `github.com` / `api.github.com` (port 443)
- `api.individual.githubcopilot.com` (port 443)
- `copilot-proxy.githubusercontent.com` (port 443)
- `registry.npmjs.org` (port 443)
- `localhost:4141` (proxy local — ne pas bloquer)

**Chaîne de proxys** : seul copilot-api passe par le proxy corporate. Claude Code pointe vers `localhost:4141` uniquement.

**Diagnostic** :
```bash
curl -v --proxy http://proxy.entreprise.fr:8080 https://api.github.com/zen
curl http://localhost:4141/v1/models
env | grep -i proxy
```

### 5. Risque sur le compte
Ces outils utilisent des API **non-officielles** de GitHub Copilot.
Une utilisation excessive peut déclencher une detection d'abus.
- Utilisez le rate-limiting
- Évitez les sessions tres longues sans pause

### 6. Noms de modèles
Meme si Claude Code pense parler à l'API Anthropic, vous specifiez des noms
de modèles **Copilot** (ex: `gpt-5.4`). Le proxy traduit tout.

---

# Tableau comparatif

| Projet | Langage | Install npx | Daemon | Auth auto | Port défaut |
|--------|---------|-------------|--------|-----------|-------------|
| copilot-api | Node.js | `npx copilot-api@latest` | Non | Oui | 4141 |
| copilot-proxy (Jer-y) | Node.js | `npx @jer-y/copilot-proxy@latest` | Oui | Oui | 4399 |
| claude-code-copilot | Node.js | Non (clone) | Non | Oui | 18080 |
| claude-copilot-proxy | Go | Non (clone) | Non | Manuel | 8082 |
| LM Proxy | VS Code ext | Non | Non | Via VS Code | 4000 |
| LiteLLM | Python | Non (pip) | Non | Via config | 4000 |

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

### Le plus flexible (Python) :
```bash
pip install 'litellm[proxy]'
litellm --config copilot-config.yaml
# Puis configurez .claude/settings.json
```
