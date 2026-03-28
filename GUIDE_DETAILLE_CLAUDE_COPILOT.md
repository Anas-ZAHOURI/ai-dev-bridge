# Guide Detaille : Claude Code via GitHub Copilot

> Pour PC de dev entreprise avec uniquement GitHub Copilot autorise.

---

## Table des matieres

1. [Comprendre l'architecture](#1-comprendre-larchitecture)
2. [Pre-requis detailles](#2-pre-requis-detailles)
3. [Installer Claude Code](#3-installer-claude-code)
4. [METHODE 1 : copilot-api via npx](#4-methode-1--copilot-api-via-npx)
5. [METHODE 1bis : copilot-proxy (Jer-y) via npx avec daemon](#5-methode-1bis--copilot-proxy-jer-y-via-npx-avec-daemon)
6. [METHODE 1ter : LM Proxy (extension VS Code)](#6-methode-1ter--lm-proxy-extension-vs-code)
7. [METHODE 2 : Cloner copilot-api et builder a la main](#7-methode-2--cloner-copilot-api-et-builder-a-la-main)
8. [METHODE 2bis : Cloner claude-code-copilot (zero dependance)](#8-methode-2bis--cloner-claude-code-copilot-zero-dependance)
9. [METHODE 2ter : LiteLLM via pip (Python)](#9-methode-2ter--litellm-via-pip-python)
10. [METHODE 2quater : claude-copilot-proxy en Go](#10-methode-2quater--claude-copilot-proxy-en-go)
11. [Configuration permanente de Claude Code](#11-configuration-permanente-de-claude-code)
12. [Gestion du proxy entreprise (HTTP_PROXY)](#12-gestion-du-proxy-entreprise-http_proxy)
13. [Optimisation du quota Copilot](#13-optimisation-du-quota-copilot)
14. [Modeles disponibles et lequel choisir](#14-modeles-disponibles-et-lequel-choisir)
15. [Depannage complet](#15-depannage-complet)
16. [Securite et risques](#16-securite-et-risques)
17. [Tableau comparatif final](#17-tableau-comparatif-final)

---

## 1. Comprendre l'architecture

### Pourquoi un proxy ?

Claude Code est concu pour parler a l'API Anthropic (format Messages API).
GitHub Copilot expose ses modeles via une API au format OpenAI.
Un proxy local fait la traduction entre les deux.

### Schema complet

```
┌──────────────┐     Format Anthropic      ┌─────────────────┐     Format OpenAI      ┌──────────────────┐
│              │  ───────────────────────>  │                 │  ──────────────────>   │                  │
│  Claude Code │    POST /v1/messages       │  Proxy local    │   POST /v1/chat/       │  API GitHub      │
│  (terminal)  │    localhost:4141          │  (Node/Python)  │   completions          │  Copilot         │
│              │  <───────────────────────  │                 │  <──────────────────   │                  │
└──────────────┘     Reponse Anthropic      └─────────────────┘     Reponse OpenAI      └──────────────────┘
                                                    │
                                                    │ Gere aussi :
                                                    ├─ Authentification OAuth GitHub
                                                    ├─ Renouvellement automatique du token
                                                    ├─ Suppression du parametre "thinking"
                                                    └─ Rate limiting
```

### Flux d'authentification

```
1. Vous lancez le proxy
2. Le proxy contacte GitHub : "je veux un device code"
3. GitHub repond : "voici le code XXXX-XXXX, envoyez l'utilisateur sur github.com/login/device"
4. Vous ouvrez le navigateur, entrez le code, autorisez
5. Le proxy recoit un token OAuth (ghu_...)
6. Ce token est sauvegarde localement (~/.copilot-api/ ou similaire)
7. A chaque requete, le proxy utilise ce token pour obtenir un token temporaire Copilot
8. Le token temporaire est utilise pour appeler l'API Copilot
9. Le proxy renouvelle automatiquement les tokens expires
```

---

## 2. Pre-requis detailles

### Node.js

```bash
# Verifier si Node.js est installe
node --version
# Doit afficher v18.x.x ou superieur

npm --version
# Doit afficher 9.x.x ou superieur
```

**Si Node.js n'est pas installe :**

```bash
# Option A : nvm (recommande - permet plusieurs versions)
# Sur Linux/macOS/WSL :
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Sur Windows natif : telechargez nvm-windows
# https://github.com/coreybutler/nvm-windows/releases
# Puis :
nvm install 20
nvm use 20

# Option B : Installateur direct
# https://nodejs.org/en/download
# Choisissez la version LTS
```

### Git

```bash
git --version
# Necessaire uniquement pour la methode 2 (clone)
```

### Python (uniquement pour LiteLLM)

```bash
python --version   # ou python3 --version
pip --version      # ou pip3 --version
# Python 3.8+ requis
```

### Go (uniquement pour claude-copilot-proxy)

```bash
go version
# Go 1.21+ requis
```

### Compte GitHub avec Copilot

Verifiez que votre licence Copilot est active :
1. Allez sur https://github.com/settings/copilot
2. Vous devez voir "Copilot is active" ou equivalent
3. Notez votre type : Individual, Business, ou Enterprise

---

## 3. Installer Claude Code

```bash
# Installation globale
npm install -g @anthropic-ai/claude-code

# Verifiez
claude --version
```

**Si npm install echoue derriere un proxy entreprise :**

```bash
# Configurez npm pour utiliser le proxy
npm config set proxy http://proxy.entreprise.fr:8080
npm config set https-proxy http://proxy.entreprise.fr:8080

# Si le proxy necessite une authentification
npm config set proxy http://utilisateur:motdepasse@proxy.entreprise.fr:8080
npm config set https-proxy http://utilisateur:motdepasse@proxy.entreprise.fr:8080

# Si le registre npm est bloque, utilisez un miroir
npm config set registry https://registry.npmmirror.com

# Puis relancez
npm install -g @anthropic-ai/claude-code
```

**Si vous n'avez pas les droits d'installation globale :**

```bash
# Installez dans votre home
npm install --prefix ~/.local @anthropic-ai/claude-code

# Ajoutez au PATH
export PATH="$HOME/.local/node_modules/.bin:$PATH"
# Ajoutez cette ligne dans ~/.bashrc ou ~/.zshrc pour la rendre permanente
```

---

## 4. METHODE 1 : copilot-api via npx

**Repo** : https://github.com/ericc-ch/copilot-api
**Difficulte** : Facile
**Temps** : 2 minutes

### 4.1 Lancement automatique (mode --claude-code)

```bash
# Rien a installer, npx telecharge et execute directement
npx copilot-api@latest start --claude-code
```

**Ce qui se passe dans le terminal :**

```
copilot-api v2.x.x
Starting proxy server on port 4141...

🔑 Device authentication required
Please visit: https://github.com/login/device
Enter code: AB12-CD34

Waiting for authorization...
✅ Authentication successful!

Select primary model:
  1. gpt-4.1
  2. claude-sonnet-4
  3. claude-opus-4
  4. gpt-4o
  > 1

Select small/fast model:
  1. gpt-4.1-mini
  2. gpt-4o-mini
  > 1

📋 Launch command copied to clipboard!
Paste it in another terminal to start Claude Code.

Proxy running on http://localhost:4141
```

**Dans un 2e terminal, collez la commande du presse-papier :**

```bash
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_AUTH_TOKEN=dummy \
ANTHROPIC_MODEL=gpt-4.1 \
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini \
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1 \
claude
```

### 4.2 Lancement manuel (sans --claude-code)

```bash
# Terminal 1 : demarrer le proxy avec options
npx copilot-api@latest start \
  --port 4141 \
  --account-type business \
  --rate-limit 30 \
  --wait \
  --verbose
```

```bash
# Terminal 2 : lancer Claude Code
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_AUTH_TOKEN=dummy \
ANTHROPIC_MODEL=gpt-4.1 \
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini \
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1 \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude
```

### 4.3 Installation globale (si npx est lent ou bloque)

```bash
npm install -g copilot-api

# Puis utilisez directement
copilot-api start --claude-code
```

### 4.4 Toutes les options CLI

```
copilot-api start [options]

Options :
  --port, -p <number>          Port du proxy (defaut: 4141)
  --verbose, -v                Logs detailles dans le terminal
  --account-type, -a <type>    individual | business | enterprise
  --manual                     Demander confirmation pour chaque requete
  --rate-limit, -r <seconds>   Delai minimum entre les requetes
  --wait, -w                   Attendre (au lieu d'erreur 429) si rate-limit
  --github-token, -g <token>   Fournir le token GitHub directement
  --claude-code, -c            Mode interactif pour Claude Code
  --show-token                 Afficher les tokens pendant l'auth
  --proxy-env                  Utiliser HTTP_PROXY / HTTPS_PROXY du systeme

Autres commandes :
  copilot-api auth             Authentification seule (sans demarrer le proxy)
  copilot-api check-usage      Afficher la consommation de quota
  copilot-api debug            Informations de diagnostic
```

### 4.5 Endpoints exposes par le proxy

| Endpoint | Format | Description |
|----------|--------|-------------|
| `POST /v1/messages` | Anthropic | Utilise par Claude Code |
| `POST /v1/messages/count_tokens` | Anthropic | Comptage de tokens |
| `POST /v1/chat/completions` | OpenAI | Compatible avec d'autres outils |
| `GET /v1/models` | OpenAI | Liste des modeles disponibles |
| `POST /v1/embeddings` | OpenAI | Embeddings (si supporte) |
| `GET /usage` | Custom | Statistiques d'utilisation |
| `GET /token` | Custom | Info sur le token actuel |

---

## 5. METHODE 1bis : copilot-proxy (Jer-y) via npx avec daemon

**Repo** : https://github.com/Jer-y/copilot-proxy
**Difficulte** : Facile
**Temps** : 3 minutes
**Avantage** : Tourne en arriere-plan, redemarrage automatique

### 5.1 Lancement rapide

```bash
npx @jer-y/copilot-proxy@latest start --claude-code
```

Meme flow que copilot-api : auth GitHub, choix de modeles, commande copiee.

### 5.2 Mode daemon (arriere-plan)

C'est le gros avantage de ce fork : le proxy peut tourner en service systeme.

```bash
# Installer en global (necessaire pour le daemon)
npm install -g @jer-y/copilot-proxy

# Premiere authentification
copilot-proxy auth

# Demarrer en daemon (arriere-plan)
copilot-proxy start -d

# Verifier que ca tourne
copilot-proxy status
```

**Sortie de `copilot-proxy status` :**
```
copilot-proxy daemon status:
  Status: running
  PID: 12345
  Port: 4399
  Uptime: 2h 34m
  Requests served: 147
```

### 5.3 Gestion complete du daemon

```bash
# Demarrer en arriere-plan
copilot-proxy start -d

# Voir le statut
copilot-proxy status

# Voir les logs en direct
copilot-proxy logs
copilot-proxy logs --tail 50     # 50 dernieres lignes

# Arreter
copilot-proxy stop

# Redemarrer (utile apres une mise a jour)
copilot-proxy restart

# Activer le demarrage automatique au boot du PC
copilot-proxy enable

# Desactiver le demarrage automatique
copilot-proxy disable
```

### 5.4 Ce que fait `copilot-proxy enable`

Selon votre OS :
- **Linux** : cree un service systemd dans `~/.config/systemd/user/`
- **macOS** : cree un plist dans `~/Library/LaunchAgents/`
- **Windows** : cree une tache planifiee dans le Task Scheduler

Resultat : le proxy demarre automatiquement a chaque ouverture de session.
Vous n'avez plus qu'a lancer `claude` et ca marche.

### 5.5 Configuration Claude Code

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4399",
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

---

## 6. METHODE 1ter : LM Proxy (extension VS Code)

**Repo** : https://github.com/ryonakae/vscode-lm-proxy
**Difficulte** : Tres facile
**Temps** : 1 minute
**Contrainte** : VS Code doit rester ouvert

### 6.1 Installation

1. Ouvrez VS Code
2. Allez dans Extensions (Ctrl+Shift+X)
3. Cherchez "LM Proxy" par ryonakae
4. Cliquez "Install"

Ou en ligne de commande :
```bash
code --install-extension ryonakae.vscode-lm-proxy
```

### 6.2 Configuration de l'extension

Ouvrez les settings de VS Code (Ctrl+,) et cherchez "LM Proxy" :
- **Port** : 4000 (defaut)
- **Models** : laissez par defaut ou personnalisez

### 6.3 Utilisation

1. Ouvrez VS Code (l'extension demarre automatiquement)
2. Dans un terminal :

```bash
ANTHROPIC_BASE_URL=http://localhost:4000/anthropic/claude \
ANTHROPIC_API_KEY=dummy \
claude
```

### 6.4 Avantages / Inconvenients

**Avantages :**
- Aucune authentification supplementaire (utilise celle de VS Code/Copilot)
- Pas de gestion de token
- Installation en 1 clic

**Inconvenients :**
- VS Code doit rester ouvert
- Moins d'options de configuration
- Pas de rate limiting integre

---

## 7. METHODE 2 : Cloner copilot-api et builder a la main

**Repo** : https://github.com/ericc-ch/copilot-api
**Difficulte** : Moyenne
**Temps** : 5-10 minutes
**Quand l'utiliser** : npx est bloque, vous voulez modifier le code, ou politique entreprise

### 7.1 Cloner et builder

```bash
# Cloner le projet
git clone https://github.com/ericc-ch/copilot-api.git
cd copilot-api

# Voir la structure
ls -la
```

**Structure du projet :**
```
copilot-api/
├── src/
│   ├── index.ts          # Point d'entree CLI
│   ├── server/           # Serveur HTTP (Hono)
│   │   ├── routes/       # Routes API (anthropic, openai)
│   │   └── middleware/    # Rate limiting, logging
│   ├── copilot/          # Client API Copilot
│   │   ├── auth.ts       # Authentification OAuth
│   │   ├── token.ts      # Gestion des tokens
│   │   └── api.ts        # Appels a l'API Copilot
│   └── transform/        # Traduction Anthropic <-> OpenAI
├── package.json
├── tsconfig.json
└── README.md
```

```bash
# Installer les dependances
npm install

# Builder le TypeScript en JavaScript
npm run build

# Le resultat est dans dist/
ls dist/
```

### 7.2 Lancer

```bash
# Lancer avec le mode Claude Code
node dist/index.js start --claude-code

# Ou lancer manuellement
node dist/index.js start --port 4141 --verbose
```

### 7.3 Authentification manuelle (si le device flow ne marche pas)

Si le navigateur ne s'ouvre pas (environnement sans GUI) :

```bash
# 1. Lancez l'auth seule
node dist/index.js auth --show-token

# 2. Copiez l'URL et le code affiches
# 3. Ouvrez l'URL sur un autre appareil (telephone, autre PC)
# 4. Entrez le code
# 5. Le token s'affiche dans le terminal
# 6. Relancez le proxy
node dist/index.js start
```

### 7.4 Mettre a jour

```bash
cd copilot-api
git pull origin main
npm install
npm run build
# Relancez le proxy
```

---

## 8. METHODE 2bis : Cloner claude-code-copilot (zero dependance)

**Repo** : https://github.com/samarth777/claude-code-copilot
**Difficulte** : Facile
**Temps** : 3-5 minutes
**Avantage** : Aucune dependance npm, Node.js pur, recherche web integree

### 8.1 Cloner

```bash
git clone https://github.com/samarth777/claude-code-copilot.git
cd claude-code-copilot
```

**Structure du projet :**
```
claude-code-copilot/
├── src/
│   └── proxy.mjs           # Le proxy (fichier unique)
├── scripts/
│   ├── auth.mjs             # Script d'authentification
│   └── launch.sh            # Script de lancement tout-en-un
├── docker-compose.yml       # Pour Docker (optionnel)
└── README.md
```

> **Pas de `npm install`** : ce projet n'a aucune dependance externe.
> Il utilise uniquement les modules natifs de Node.js (http, https, crypto).

### 8.2 Authentification

```bash
node scripts/auth.mjs
```

**Ce qui se passe :**
```
GitHub Device Authentication
============================
Please visit: https://github.com/login/device
Enter this code: AB12-CD34

Waiting for authorization... (expires in 15 minutes)

✅ Authentication successful!
Token saved to: ~/.claude-copilot-auth.json
```

**Le fichier token :**
```bash
cat ~/.claude-copilot-auth.json
```
```json
{
  "access_token": "ghu_xxxxxxxxxxxx",
  "token_type": "bearer",
  "scope": "read:user",
  "created_at": 1711545600
}
```

### 8.3 Lancement automatique

```bash
# Le script lance le proxy ET Claude Code
bash scripts/launch.sh
```

### 8.4 Lancement manuel (2 terminaux)

```bash
# Terminal 1 : le proxy
node src/proxy.mjs

# Sortie :
# Copilot proxy server listening on port 18080
# Auth token loaded from ~/.claude-copilot-auth.json
```

```bash
# Terminal 2 : Claude Code
ANTHROPIC_BASE_URL=http://localhost:18080 \
ANTHROPIC_API_KEY=copilot-proxy \
claude
```

### 8.5 Personnalisation

Variables d'environnement pour le proxy :

```bash
# Changer le port
COPILOT_PROXY_PORT=9090 node src/proxy.mjs

# Changer l'emplacement du token
COPILOT_AUTH_FILE=/chemin/custom/token.json node src/proxy.mjs

# Activer la recherche web Brave (optionnel)
BRAVE_API_KEY=votre_cle_brave \
WEB_SEARCH_MAX_RESULTS=10 \
node src/proxy.mjs
```

### 8.6 Recherche web integree

Ce proxy est le seul a inclure une recherche web fonctionnelle pour Claude Code :

- **Sans cle API** : utilise DuckDuckGo (gratuit, illimite)
- **Avec BRAVE_API_KEY** : utilise Brave Search (meilleure qualite)

Du coup vous n'avez PAS besoin de `"deny": ["WebSearch"]` avec ce proxy.

### 8.7 Docker (optionnel)

```bash
# Lancer avec Docker Compose
docker compose up -d

# Puis
ANTHROPIC_BASE_URL=http://localhost:18080 \
ANTHROPIC_API_KEY=copilot-proxy \
claude
```

---

## 9. METHODE 2ter : LiteLLM via pip (Python)

**Doc** : https://docs.litellm.ai
**Difficulte** : Moyenne
**Temps** : 5-10 minutes
**Avantage** : Le plus flexible, supporte tous les modeles, interface d'admin web

### 9.1 Installer

```bash
pip install 'litellm[proxy]'

# Verifiez
litellm --version
```

**Si pip est derriere un proxy entreprise :**
```bash
pip install --proxy http://proxy.entreprise.fr:8080 'litellm[proxy]'
```

### 9.2 Creer le fichier de configuration

Creez un fichier `copilot-config.yaml` :

```yaml
# copilot-config.yaml
model_list:
  # Modele principal pour Claude Code
  - model_name: claude-sonnet-4
    litellm_params:
      model: github_copilot/claude-sonnet-4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Modele rapide pour les taches legeres
  - model_name: gpt-4.1-mini
    litellm_params:
      model: github_copilot/gpt-4.1-mini
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Modele puissant (optionnel)
  - model_name: gpt-4.1
    litellm_params:
      model: github_copilot/gpt-4.1
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Claude Opus via Copilot (optionnel)
  - model_name: claude-opus-4
    litellm_params:
      model: github_copilot/claude-opus-4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

# CRITIQUE : supprime les parametres non supportes comme "thinking"
litellm_settings:
  drop_params: true
```

### 9.3 Authentification GitHub pour LiteLLM

LiteLLM a besoin d'un token GitHub Copilot. Deux options :

**Option A : Variable d'environnement**
```bash
# Si vous avez deja un token (obtenu via copilot-api auth ou autre)
export GITHUB_TOKEN=ghu_xxxxxxxxxxxx
```

**Option B : Utiliser copilot-api juste pour l'auth**
```bash
npx copilot-api@latest auth --show-token
# Copiez le token affiche
export GITHUB_TOKEN=ghu_xxxxxxxxxxxx
```

### 9.4 Lancer LiteLLM

```bash
litellm --config copilot-config.yaml --port 4000
```

**Sortie :**
```
LiteLLM Proxy v1.x.x
Starting server on http://0.0.0.0:4000

Available models:
  - claude-sonnet-4
  - gpt-4.1-mini
  - gpt-4.1
  - claude-opus-4

Admin UI: http://0.0.0.0:4000/ui
```

### 9.5 Configurer Claude Code

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "github_copilot/claude-sonnet-4",
    "ANTHROPIC_SMALL_FAST_MODEL": "github_copilot/gpt-4.1-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "deny": ["WebSearch"]
  }
}
```

### 9.6 Interface d'administration

LiteLLM inclut un dashboard web a `http://localhost:4000/ui` ou vous pouvez :
- Voir les requetes en temps reel
- Surveiller la consommation de tokens
- Gerer les modeles
- Voir les erreurs

---

## 10. METHODE 2quater : claude-copilot-proxy en Go

**Repo** : https://github.com/acheong08/claude-copilot-proxy
**Difficulte** : Moyenne
**Temps** : 5 minutes
**Avantage** : Leger, rapide, un seul binaire

### 10.1 Cloner et lancer

```bash
git clone https://github.com/acheong08/claude-copilot-proxy.git
cd claude-copilot-proxy
```

### 10.2 Obtenir un token Copilot

Vous avez besoin d'un token d'API Copilot (pas le token GitHub classique).
Utilisez un autre outil pour l'obtenir :

```bash
# Methode rapide avec copilot-api
npx copilot-api@latest auth --show-token
# Copiez le token ghu_...
```

### 10.3 Lancer le proxy

```bash
export COPILOT_API_KEY="ghu_votre_token_ici"
go run ./cmd/proxy/
```

**Sortie :**
```
Starting proxy on :8082
```

### 10.4 Lancer Claude Code

```bash
ANTHROPIC_BASE_URL=http://localhost:8082 \
ANTHROPIC_API_KEY=copilot-proxy \
claude
```

### 10.5 Builder un binaire (optionnel)

```bash
go build -o copilot-proxy ./cmd/proxy/

# Puis lancer directement
COPILOT_API_KEY="ghu_..." ./copilot-proxy
```

---

## 11. Configuration permanente de Claude Code

Au lieu de taper les variables d'environnement a chaque fois, configurez-les une fois.

### 11.1 Configuration globale (pour tous les projets)

Editez `~/.claude/settings.json` :

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

**Sur Windows**, le chemin est :
```
C:\Users\VOTRE_USER\.claude\settings.json
```

### 11.2 Configuration par projet

Creez `.claude/settings.json` a la racine de votre projet :

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-4.1",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-4.1-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### 11.3 Via les variables d'environnement du shell

Ajoutez dans votre `~/.bashrc`, `~/.zshrc`, ou profil PowerShell :

```bash
# ~/.bashrc ou ~/.zshrc
export ANTHROPIC_BASE_URL="http://localhost:4141"
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_MODEL="gpt-4.1"
export ANTHROPIC_SMALL_FAST_MODEL="gpt-4.1-mini"
export DISABLE_NON_ESSENTIAL_MODEL_CALLS="1"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
```

```powershell
# PowerShell ($PROFILE)
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
$env:ANTHROPIC_AUTH_TOKEN = "dummy"
$env:ANTHROPIC_MODEL = "gpt-4.1"
$env:ANTHROPIC_SMALL_FAST_MODEL = "gpt-4.1-mini"
$env:DISABLE_NON_ESSENTIAL_MODEL_CALLS = "1"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
```

---

## 12. Gestion du proxy entreprise (HTTP_PROXY)

En entreprise, l'acces internet passe souvent par un proxy HTTP.

### 12.1 Configurer npm

```bash
npm config set proxy http://proxy.entreprise.fr:8080
npm config set https-proxy http://proxy.entreprise.fr:8080

# Avec authentification
npm config set proxy http://user:pass@proxy.entreprise.fr:8080
npm config set https-proxy http://user:pass@proxy.entreprise.fr:8080

# Verifier
npm config get proxy
npm config get https-proxy
```

### 12.2 Configurer git

```bash
git config --global http.proxy http://proxy.entreprise.fr:8080
git config --global https.proxy http://proxy.entreprise.fr:8080
```

### 12.3 Configurer le proxy copilot-api

```bash
# Option 1 : flag --proxy-env (utilise HTTP_PROXY du systeme)
npx copilot-api@latest start --proxy-env

# Option 2 : variables d'environnement explicites
export HTTP_PROXY=http://proxy.entreprise.fr:8080
export HTTPS_PROXY=http://proxy.entreprise.fr:8080
export NO_PROXY=localhost,127.0.0.1
npx copilot-api@latest start
```

### 12.4 Configurer pip (pour LiteLLM)

```bash
pip install --proxy http://proxy.entreprise.fr:8080 'litellm[proxy]'

# Ou dans pip.conf
# Linux: ~/.config/pip/pip.conf
# Windows: %APPDATA%\pip\pip.ini
[global]
proxy = http://proxy.entreprise.fr:8080
```

### 12.5 Certificats SSL auto-signes (frequent en entreprise)

Si vous avez des erreurs SSL `UNABLE_TO_VERIFY_LEAF_SIGNATURE` :

```bash
# Pour Node.js (copilot-api, claude code)
export NODE_TLS_REJECT_UNAUTHORIZED=0
# ⚠️ Desactive la verification SSL - utilisez uniquement en dev

# Meilleure solution : ajouter le certificat racine de l'entreprise
export NODE_EXTRA_CA_CERTS=/chemin/vers/certificat-entreprise.pem

# Pour Python (LiteLLM)
export REQUESTS_CA_BUNDLE=/chemin/vers/certificat-entreprise.pem
# Ou :
export SSL_CERT_FILE=/chemin/vers/certificat-entreprise.pem
```

---

## 13. Optimisation du quota Copilot

Claude Code est TRES gourmand en tokens. Une session de 30 minutes peut
consommer autant qu'une journee de Copilot Chat.

### 13.1 Variables d'environnement essentielles

```bash
# Reduit les appels en arriere-plan (completions, suggestions)
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1

# Desactive le trafic non-essentiel (telemetrie, checks)
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

**Ces deux variables sont OBLIGATOIRES.** Sans elles, Claude Code fait
des dizaines d'appels supplementaires que vous ne voyez pas.

### 13.2 Rate limiting sur le proxy

```bash
# Attendre 30 secondes minimum entre chaque requete
npx copilot-api@latest start --rate-limit 30 --wait

# --wait : au lieu d'une erreur 429, le proxy attend puis reessaie
# Sans --wait : vous recevez une erreur et devez relancer
```

### 13.3 Choisir le bon modele

| Modele | Tokens/requete | Qualite | Recommandation |
|--------|---------------|---------|----------------|
| gpt-4.1-mini | Faible | Correcte | Modele rapide, taches simples |
| gpt-4.1 | Moyen | Bonne | Bon equilibre |
| claude-sonnet-4 | Moyen | Tres bonne | Meilleur pour le code |
| claude-opus-4 | Eleve | Excellente | Taches complexes uniquement |

**Recommandation :**
- `ANTHROPIC_MODEL=gpt-4.1` (principal)
- `ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini` (taches legeres)

### 13.4 Bonnes pratiques

1. **Soyez precis** : "corrige le bug ligne 42 de server.js" consomme moins que "corrige les bugs"
2. **Evitez les sessions longues** : fermez et relancez Claude Code regulierement
3. **Surveillez le quota** : `npx copilot-api@latest check-usage`
4. **Utilisez /compact** dans Claude Code pour compresser le contexte
5. **Desactivez WebSearch** : chaque recherche web = requetes supplementaires inutiles

---

## 14. Modeles disponibles et lequel choisir

Les modeles disponibles dependent de votre licence Copilot.

### 14.1 Modeles courants via Copilot

| Modele | Fournisseur | Forces |
|--------|-------------|--------|
| `gpt-4.1` | OpenAI | Polyvalent, bon en code |
| `gpt-4.1-mini` | OpenAI | Rapide, economique |
| `gpt-4o` | OpenAI | Multimodal |
| `gpt-4o-mini` | OpenAI | Tres rapide |
| `claude-sonnet-4` | Anthropic | Excellent en code, raisonnement |
| `claude-opus-4` | Anthropic | Le plus puissant mais lent |
| `claude-haiku-4` | Anthropic | Rapide, economique |
| `o3` | OpenAI | Raisonnement avance |
| `o3-mini` | OpenAI | Raisonnement, plus rapide |

### 14.2 Voir les modeles disponibles

```bash
# Via copilot-api
curl http://localhost:4141/v1/models | jq

# Via le navigateur
# Ouvrez http://localhost:4141/v1/models
```

### 14.3 Combinaisons recommandees

**Pour du dev quotidien :**
```
ANTHROPIC_MODEL=gpt-4.1
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini
```

**Pour de la qualite maximale :**
```
ANTHROPIC_MODEL=claude-sonnet-4
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini
```

**Pour economiser le quota :**
```
ANTHROPIC_MODEL=gpt-4.1-mini
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini
```

---

## 15. Depannage complet

### 15.1 Erreurs de connexion

**`ECONNREFUSED localhost:4141`**
```
Cause : le proxy n'est pas lance
Solution : verifiez que le proxy tourne dans un autre terminal
  npx copilot-api@latest start
```

**`ECONNRESET` ou `socket hang up`**
```
Cause : le proxy a crashe
Solution : relancez le proxy, ajoutez --verbose pour voir les logs
```

**`ETIMEDOUT` vers api.github.com**
```
Cause : proxy entreprise bloque la connexion
Solution :
  export HTTP_PROXY=http://proxy.entreprise.fr:8080
  export HTTPS_PROXY=http://proxy.entreprise.fr:8080
  npx copilot-api@latest start --proxy-env
```

### 15.2 Erreurs d'authentification

**`401 Unauthorized`**
```
Cause : token expire ou invalide
Solution : relancez l'authentification
  npx copilot-api@latest auth
```

**`403 Forbidden`**
```
Cause : licence Copilot inactive ou modele non autorise
Solution :
  1. Verifiez https://github.com/settings/copilot
  2. Essayez un autre modele (gpt-4o au lieu de claude-sonnet-4)
  3. Verifiez --account-type (individual/business/enterprise)
```

**Le device code expire avant que je puisse l'entrer**
```
Cause : le navigateur ne s'ouvre pas automatiquement
Solution : copiez manuellement l'URL et le code affiches
```

### 15.3 Erreurs de modele

**`thinking parameter not supported`**
```
Cause : Claude Code envoie un parametre que Copilot ne comprend pas
Solution :
  - Avec copilot-api/copilot-proxy : normalement gere automatiquement, mettez a jour
  - Avec LiteLLM : ajoutez drop_params: true dans la config YAML
```

**`model not found` ou `model not available`**
```
Cause : le modele demande n'est pas disponible sur votre licence
Solution :
  1. curl http://localhost:4141/v1/models pour voir les modeles dispo
  2. Changez ANTHROPIC_MODEL pour un modele disponible
```

### 15.4 Erreurs de quota

**`429 Too Many Requests`**
```
Cause : trop de requetes en peu de temps
Solution :
  npx copilot-api@latest start --rate-limit 30 --wait
  (30 secondes minimum entre les requetes, attend au lieu d'erreur)
```

**Quota mensuel epuise**
```
Cause : Claude Code consomme beaucoup de tokens
Solution :
  1. Attendez le renouvellement du quota
  2. Utilisez des modeles plus legers (gpt-4.1-mini)
  3. Activez DISABLE_NON_ESSENTIAL_MODEL_CALLS=1
  4. npx copilot-api@latest check-usage pour surveiller
```

### 15.5 Problemes Windows specifiques

**`command not found: npx`**
```
Solution : Node.js n'est pas dans le PATH
  1. Reinstallez Node.js avec l'option "Add to PATH"
  2. Ou ajoutez manuellement : set PATH=%PATH%;C:\Program Files\nodejs
```

**Les scripts bash ne marchent pas (launch.sh)**
```
Solution : utilisez Git Bash, WSL, ou lancez manuellement les commandes
  node src/proxy.mjs   (terminal 1)
  claude                (terminal 2)
```

**Probleme de droits d'execution npm global**
```
Solution :
  npm config set prefix %USERPROFILE%\.npm-global
  set PATH=%PATH%;%USERPROFILE%\.npm-global
```

---

## 16. Securite et risques

### 16.1 API non-officielle

Tous ces proxies utilisent des API **reverse-engineered** de GitHub Copilot.
Ce n'est PAS un usage supporte officiellement par GitHub.

**Risques :**
- Suspension temporaire de l'acces Copilot en cas d'abus detecte
- Les API peuvent changer sans preavis (mise a jour du proxy necessaire)
- Pas de support officiel en cas de probleme

### 16.2 Bonnes pratiques de securite

1. **Ne commitez JAMAIS vos tokens** : ajoutez a `.gitignore` :
   ```
   .claude-copilot-auth.json
   .copilot-api/
   ```

2. **Le proxy ecoute en local uniquement** : par defaut sur `localhost`/`127.0.0.1`.
   Ne l'exposez JAMAIS sur `0.0.0.0` en entreprise.

3. **Le token `ANTHROPIC_AUTH_TOKEN=dummy`** n'est pas un vrai token.
   Les proxies acceptent n'importe quelle valeur car l'auth se fait cote GitHub.

4. **Surveillez les mises a jour** des proxies pour les correctifs de securite.

### 16.3 Conformite entreprise

Avant d'utiliser ces outils en entreprise :
- Verifiez les conditions d'utilisation de votre licence GitHub Copilot
- Consultez votre equipe securite/conformite
- L'utilisation de proxies non-officiels peut violer les ToS de GitHub
- Les donnees de code transitent par les serveurs de GitHub/OpenAI/Anthropic

---

## 17. Tableau comparatif final

| Critere | copilot-api (npx) | copilot-proxy (npx) | LM Proxy (VS Code) | claude-code-copilot (clone) | LiteLLM (pip) | Go proxy (clone) |
|---------|-------------------|---------------------|---------------------|----------------------------|---------------|-------------------|
| **Difficulte** | Facile | Facile | Tres facile | Facile | Moyenne | Moyenne |
| **Temps install** | 2 min | 3 min | 1 min | 3 min | 5 min | 5 min |
| **npm/npx** | Oui | Oui | Non | Non | Non | Non |
| **Dependances** | Node.js | Node.js | VS Code | Node.js seul | Python | Go |
| **Mode daemon** | Non | Oui | Via VS Code | Non | Non | Non |
| **Auth auto** | Oui | Oui | Via VS Code | Oui | Manuelle | Manuelle |
| **Rate limiting** | Oui | Oui | Non | Non | Via config | Non |
| **Recherche web** | Non | Non | Non | Oui (DuckDuckGo) | Non | Non |
| **Dashboard** | Non | Non | Non | Non | Oui (web UI) | Non |
| **Port defaut** | 4141 | 4399 | 4000 | 18080 | 4000 | 8082 |
| **Communaute** | Grande | Moyenne | Petite | Petite | Grande | Petite |
| **Maintenance** | Active | Active | Active | Active | Active | Faible |

---

## Recommandation finale

| Situation | Solution recommandee |
|-----------|---------------------|
| Je veux que ca marche vite | copilot-api avec `npx` (methode 1) |
| Je veux un service permanent | copilot-proxy avec daemon (methode 1bis) |
| VS Code est toujours ouvert | LM Proxy extension (methode 1ter) |
| npx est bloque dans mon entreprise | claude-code-copilot clone (methode 2bis) |
| Je veux du controle total | LiteLLM (methode 2ter) |
| Je suis developpeur Go | claude-copilot-proxy (methode 2quater) |
