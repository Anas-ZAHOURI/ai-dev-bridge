# Guide Détaillé : Claude Code via GitHub Copilot / Gemini Code Assist

> Pour PC de dev entreprise avec GitHub Copilot et/ou Google Gemini Code Assist autorisé.

---

## Table des matières

1. [Comprendre l'architecture](#1-comprendre-larchitecture)
2. [Prérequis détaillés](#2-prérequis-détaillés)
3. [Installer Claude Code](#3-installer-claude-code)
4. [MÉTHODE 1 : copilot-api via npx](#4-méthode-1--copilot-api-via-npx)
5. [MÉTHODE 1bis : copilot-proxy (Jer-y) via npx avec daemon](#5-méthode-1bis--copilot-proxy-jer-y-via-npx-avec-daemon)
6. [MÉTHODE 1ter : LM Proxy (extension VS Code)](#6-méthode-1ter--lm-proxy-extension-vs-code)
7. [MÉTHODE 2 : Cloner copilot-api et builder à la main](#7-méthode-2--cloner-copilot-api-et-builder-a-la-main)
8. [MÉTHODE 2bis : Cloner claude-code-copilot (zéro dépendance)](#8-méthode-2bis--cloner-claude-code-copilot-zéro-dépendance)
9. [MÉTHODE 2ter : LiteLLM via pip (Python)](#9-méthode-2ter--litellm-via-pip-python)
10. [MÉTHODE 2quater : claude-copilot-proxy en Go](#10-méthode-2quater--claude-copilot-proxy-en-go)
11. [MÉTHODE 3 : cc-copilot-bridge (multi-provider)](#11-méthode-3--cc-copilot-bridge-multi-provider)
12. [MÉTHODE 3bis : copilot-api fork Anthropic-first](#12-méthode-3bis--copilot-api-fork-anthropic-first)
13. [Configuration permanente de Claude Code](#13-configuration-permanente-de-claude-code)
14. [Gestion du proxy entreprise (HTTP_PROXY)](#14-gestion-du-proxy-entreprise-http_proxy)
15. [Optimisation du quota Copilot](#15-optimisation-du-quota-copilot)
16. [Modèles disponibles et lequel choisir](#16-modèles-disponibles-et-lequel-choisir)
17. [Dépannage complet](#17-dépannage-complet)
18. [Sécurité et risques](#18-sécurité-et-risques)
19. [Tableau comparatif final](#19-tableau-comparatif-final)

---

## 1. Comprendre l'architecture

### Pourquoi un proxy ?

Claude Code est conçu pour parler à l'API Anthropic (format Messages API).
GitHub Copilot expose ses modèles via une API au format OpenAI, et Google Gemini
via l'API Generative Language. Un proxy local fait la traduction entre ces formats.

### Schéma complet

```
                                                                      ┌──────────────────┐
                                                        Format OpenAI │  API GitHub      │
                                                    ┌───────────────> │  Copilot         │
┌──────────────┐     Format Anthropic      ┌────────┴────────┐       └──────────────────┘
│              │  ───────────────────────>  │                 │
│  Claude Code │    POST /v1/messages       │  Proxy local    │
│  (terminal)  │    localhost:4141          │  (Node/Python)  │
│              │  <───────────────────────  │                 │
└──────────────┘     Réponse Anthropic      └────────┬────────┘       ┌──────────────────┐
                                                     │  Format Gemini │  API Google      │
                                                     └──────────────> │  Gemini          │
                                                                      └──────────────────┘
                                                    Le proxy gère :
                                                    - Authentification (OAuth GitHub / Google Cloud)
                                                    - Renouvellement automatique du token
                                                    - Suppression du paramètre "thinking"
                                                    - Rate limiting
```

**Deux fournisseurs supportés :**
- **GitHub Copilot** : proxies dédiés Node.js (copilot-api, copilot-proxy) ou LiteLLM
- **Google Gemini Code Assist** : via LiteLLM (le seul proxy qui supporte les deux)

### Flux d'authentification

```
1. Vous lancez le proxy
2. Le proxy contacte GitHub : "je veux un device code"
3. GitHub répond : "voici le code XXXX-XXXX, envoyez l'utilisateur sur github.com/login/device"
4. Vous ouvrez le navigateur, entrez le code, autorisez
5. Le proxy reçoit un token OAuth (ghu_...)
6. Ce token est sauvegardé localement (~/.copilot-api/ ou similaire)
7. À chaque requête, le proxy utilise ce token pour obtenir un token temporaire Copilot
8. Le token temporaire est utilisé pour appeler l'API Copilot
9. Le proxy renouvelle automatiquement les tokens expirés
```

---

## 2. Prérequis détaillés

### Node.js

```bash
# Vérifier si Node.js est installé
node --version
# Doit afficher v18.x.x ou supérieur

npm --version
# Doit afficher 9.x.x ou supérieur
```

**Si Node.js n'est pas installé :**

```bash
# Option A : nvm (recommandé - permet plusieurs versions)
# Sur Linux/macOS/WSL :
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Sur Windows natif : téléchargez nvm-windows
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
# Nécessaire uniquement pour la méthode 2 (clone)
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

Vérifiez que votre licence Copilot est active :
1. Allez sur https://github.com/settings/copilot
2. Vous devez voir "Copilot is active" ou équivalent
3. Notez votre type : Individual, Business, ou Enterprise

---

## 3. Installer Claude Code

```bash
# Installation globale
npm install -g @anthropic-ai/claude-code

# Vérifiez
claude --version
```

**Si npm install échoue derrière un proxy entreprise :**

```bash
# Configurez npm pour utiliser le proxy
npm config set proxy http://proxy.entreprise.fr:8080
npm config set https-proxy http://proxy.entreprise.fr:8080

# Si le proxy nécessite une authentification
npm config set proxy http://utilisateur:mot de passe@proxy.entreprise.fr:8080
npm config set https-proxy http://utilisateur:mot de passe@proxy.entreprise.fr:8080

# Si le registre npm est bloqué, utilisez un miroir
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

## 4. MÉTHODE 1 : copilot-api via npx

**Repo** : https://github.com/ericc-ch/copilot-api
**Difficulté** : Facile
**Temps** : 2 minutes

### 4.1 Lancement automatique (mode --claude-code)

```bash
# Rien à installer, npx télécharge et exécute directement
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
  1. gpt-5.4
  2. claude-sonnet-4.6
  3. claude-opus-4.6
  4. gpt-5.2
  > 1

Select small/fast model:
  1. gpt-5.4-mini
  2. gpt-5-mini
  > 1

📋 Launch command copied to clipboard!
Paste it in another terminal to start Claude Code.

Proxy running on http://localhost:4141
```

**Dans un 2e terminal, collez la commande du presse-papier :**

```bash
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_AUTH_TOKEN=dummy \
ANTHROPIC_MODEL=gpt-5.4 \
ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini \
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1 \
claude
```

### 4.2 Lancement manuel (sans --claude-code)

```bash
# Terminal 1 : démarrer le proxy avec options
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
ANTHROPIC_MODEL=gpt-5.4 \
ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini \
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1 \
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
claude
```

### 4.3 Installation globale (si npx est lent ou bloqué)

```bash
npm install -g copilot-api

# Puis utilisez directement
copilot-api start --claude-code
```

### 4.4 Toutes les options CLI

```
copilot-api start [options]

Options :
  --port, -p <number>          Port du proxy (défaut: 4141)
  --verbose, -v                Logs détaillés dans le terminal
  --account-type, -a <type>    individual | business | enterprise
  --manual                     Demander confirmation pour chaque requête
  --rate-limit, -r <seconds>   Délai minimum entre les requêtes
  --wait, -w                   Attendre (au lieu d'erreur 429) si rate-limit
  --github-token, -g <token>   Fournir le token GitHub directement
  --claude-code, -c            Mode interactif pour Claude Code
  --show-token                 Afficher les tokens pendant l'auth
  --proxy-env                  Utiliser HTTP_PROXY / HTTPS_PROXY du système

Autres commandes :
  copilot-api auth             Authentification seule (sans démarrer le proxy)
  copilot-api check-usage      Afficher la consommation de quota
  copilot-api debug            Informations de diagnostic
```

### 4.5 Endpoints exposés par le proxy

| Endpoint | Format | Description |
|----------|--------|-------------|
| `POST /v1/messages` | Anthropic | Utilisé par Claude Code |
| `POST /v1/messages/count_tokens` | Anthropic | Comptage de tokens |
| `POST /v1/chat/completions` | OpenAI | Compatible avec d'autres outils |
| `GET /v1/models` | OpenAI | Liste des modèles disponibles |
| `POST /v1/embeddings` | OpenAI | Embeddings (si supporté) |
| `GET /usage` | Custom | Statistiques d'utilisation |
| `GET /token` | Custom | Info sur le token actuel |

---

## 5. MÉTHODE 1bis : copilot-proxy (Jer-y) via npx avec daemon

**Repo** : https://github.com/Jer-y/copilot-proxy
**Difficulté** : Facile
**Temps** : 3 minutes
**Avantage** : Tourne en arrière-plan, redémarrage automatique

### 5.1 Lancement rapide

```bash
npx @jer-y/copilot-proxy@latest start --claude-code
```

Même flow que copilot-api : auth GitHub, choix de modèles, commande copiée.

### 5.2 Mode daemon (arrière-plan)

C'est le gros avantage de ce fork : le proxy peut tourner en service système.

```bash
# Installer en global (nécessaire pour le daemon)
npm install -g @jer-y/copilot-proxy

# Première authentification
copilot-proxy auth

# Démarrer en daemon (arrière-plan)
copilot-proxy start -d

# Vérifier que ça tourne
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

### 5.3 Gestion complète du daemon

```bash
# Démarrer en arrière-plan
copilot-proxy start -d

# Voir le statut
copilot-proxy status

# Voir les logs en direct
copilot-proxy logs
copilot-proxy logs --tail 50     # 50 dernières lignes

# Arrêter
copilot-proxy stop

# Redémarrer (utile après une mise à jour)
copilot-proxy restart

# Activer le démarrage automatique au boot du PC
copilot-proxy enable

# Désactiver le démarrage automatique
copilot-proxy disable
```

### 5.4 Ce que fait `copilot-proxy enable`

Selon votre OS :
- **Linux** : crée un service systemd dans `~/.config/systemd/user/`
- **macOS** : crée un plist dans `~/Library/LaunchAgents/`
- **Windows** : crée une tâche planifiée dans le Task Scheduler

Résultat : le proxy démarre automatiquement à chaque ouverture de session.
Vous n'avez plus qu'à lancer `claude` et ça marche.

### 5.5 Configuration Claude Code

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4399",
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

---

## 6. MÉTHODE 1ter : LM Proxy (extension VS Code)

**Repo** : https://github.com/ryonakae/vscode-lm-proxy
**Difficulté** : Très facile
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
- **Port** : 4000 (défaut)
- **Models** : laissez par défaut ou personnalisez

### 6.3 Utilisation

1. Ouvrez VS Code (l'extension démarre automatiquement)
2. Dans un terminal :

```bash
ANTHROPIC_BASE_URL=http://localhost:4000/anthropic/claude \
ANTHROPIC_API_KEY=dummy \
claude
```

### 6.4 Avantages / Inconvénients

**Avantages :**
- Aucune authentification supplémentaire (utilise celle de VS Code/Copilot)
- Pas de gestion de token
- Installation en 1 clic

**Inconvénients :**
- VS Code doit rester ouvert
- Moins d'options de configuration
- Pas de rate limiting intégré

---

## 7. MÉTHODE 2 : Cloner copilot-api et builder à la main

**Repo** : https://github.com/ericc-ch/copilot-api
**Difficulté** : Moyenne
**Temps** : 5-10 minutes
**Quand l'utiliser** : npx est bloqué, vous voulez modifier le code, ou politique entreprise

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
│   ├── index.ts          # Point d'entrée CLI
│   ├── server/           # Serveur HTTP (Hono)
│   │   ├── routes/       # Routes API (anthropic, openai)
│   │   └── middleware/    # Rate limiting, logging
│   ├── copilot/          # Client API Copilot
│   │   ├── auth.ts       # Authentification OAuth
│   │   ├── token.ts      # Gestion des tokens
│   │   └── api.ts        # Appels à l'API Copilot
│   └── transform/        # Traduction Anthropic <-> OpenAI
├── package.json
├── tsconfig.json
└── README.md
```

```bash
# Installer les dépendances
npm install

# Builder le TypeScript en JavaScript
npm run build

# Le résultat est dans dist/
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

# 2. Copiez l'URL et le code affichés
# 3. Ouvrez l'URL sur un autre appareil (téléphone, autre PC)
# 4. Entrez le code
# 5. Le token s'affiche dans le terminal
# 6. Relancez le proxy
node dist/index.js start
```

### 7.4 Mettre à jour

```bash
cd copilot-api
git pull origin main
npm install
npm run build
# Relancez le proxy
```

---

## 8. MÉTHODE 2bis : Cloner claude-code-copilot (zéro dépendance)

**Repo** : https://github.com/samarth777/claude-code-copilot
**Difficulté** : Facile
**Temps** : 3-5 minutes
**Avantage** : Aucune dépendance npm, Node.js pur, recherche web intégrée

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

> **Pas de `npm install`** : ce projet n'a aucune dépendance externe.
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

### 8.6 Recherche web intégrée

Ce proxy est le seul à inclure une recherche web fonctionnelle pour Claude Code :

- **Sans clé API** : utilise DuckDuckGo (gratuit, illimité)
- **Avec BRAVE_API_KEY** : utilise Brave Search (meilleure qualité)

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

## 9. MÉTHODE 2ter : LiteLLM via pip (Python)

**Doc** : https://docs.litellm.ai
**Difficulté** : Moyenne
**Temps** : 5-10 minutes
**Avantage** : Le plus flexible, supporte tous les modèles, interface d'admin web
**Fournisseurs** : GitHub Copilot, Google Gemini Code Assist, et 100+ autres

### 9.1 Installer

```bash
pip install litellm[proxy]

# Vérifiez
litellm --version
```

**Si pip est derrière un proxy entreprise :**
```bash
pip install --proxy http://proxy.entreprise.fr:8080 litellm[proxy]
```

### 9.2 Créer le fichier de configuration

Choisissez le fichier de configuration selon votre fournisseur.

#### Option A : GitHub Copilot (`copilot-config.yaml`)

```yaml
# copilot-config.yaml
model_list:
  # Modèle principal pour Claude Code
  - model_name: claude-sonnet-4.6
    litellm_params:
      model: github_copilot/claude-sonnet-4.6
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Modèle rapide pour les tâches légères
  - model_name: gpt-5.4-mini
    litellm_params:
      model: github_copilot/gpt-5.4-mini
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Modèle puissant (optionnel)
  - model_name: gpt-5.4
    litellm_params:
      model: github_copilot/gpt-5.4
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

  # Claude Opus via Copilot (optionnel)
  - model_name: claude-opus-4.6
    litellm_params:
      model: github_copilot/claude-opus-4.6
      extra_headers:
        editor-version: "vscode/1.85.1"
        Copilot-Integration-Id: "vscode-chat"

# CRITIQUE : supprime les paramètres non supportés comme "thinking"
litellm_settings:
  drop_params: true
```

#### Option B : Google Gemini Code Assist (`gemini-config.yaml`)

```yaml
# gemini-config.yaml
model_list:
  # Modèle principal — Gemini 3.1 Pro (raisonnement avancé, code, contexte 1M tokens)
  - model_name: gemini-3.1-pro
    litellm_params:
      model: gemini/gemini-3.1-pro

  # Modèle rapide — Gemini 3 Flash (rapide, économique, multimodal)
  - model_name: gemini-3-flash
    litellm_params:
      model: gemini/gemini-3-flash

  # Modèle ultra rapide — Gemini 3.1 Flash Lite (latence minimale)
  - model_name: gemini-3.1-flash-lite
    litellm_params:
      model: gemini/gemini-3.1-flash-lite

litellm_settings:
  drop_params: true
```

#### Option C : Configuration mixte Copilot + Gemini (`mixed-config.yaml`)

```yaml
# mixed-config.yaml — utilise les deux fournisseurs
model_list:
  # --- GitHub Copilot ---
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

  # --- Google Gemini ---
  - model_name: gemini-3.1-pro
    litellm_params:
      model: gemini/gemini-3.1-pro
  - model_name: gemini-3-flash
    litellm_params:
      model: gemini/gemini-3-flash

litellm_settings:
  drop_params: true
```

> Avec la config mixte, vous pouvez basculer entre Copilot et Gemini en changeant
> simplement `ANTHROPIC_MODEL` dans votre `settings.json`.

### 9.3 Authentification pour LiteLLM

#### Pour GitHub Copilot :

LiteLLM a besoin d'un token GitHub Copilot. Deux options :

**Option A : Variable d'environnement**
```bash
# Si vous avez déjà un token (obtenu via copilot-api auth ou autre)
export GITHUB_TOKEN=ghu_xxxxxxxxxxxx
```

**Option B : Utiliser copilot-api juste pour l'auth**
```bash
npx copilot-api@latest auth --show-token
# Copiez le token affiché
export GITHUB_TOKEN=ghu_xxxxxxxxxxxx
```

#### Pour Google Gemini Code Assist :

Trois options selon votre environnement :

**Option A : Clé API Google AI Studio (le plus simple)**
```bash
# Obtenez votre clé sur https://aistudio.google.com/apikey
export GEMINI_API_KEY=AIzaSy...votre_cle
```

**Option B : gcloud CLI (pour Vertex AI en entreprise)**
```bash
# Authentification interactive
gcloud auth application-default login

# Configurez le projet Google Cloud
export VERTEXAI_PROJECT=votre-projet-gcp
export VERTEXAI_LOCATION=us-central1   # ou europe-west1, etc.
```

**Option C : Clé de compte de service (CI/CD, serveurs)**
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/chemin/vers/service-account.json
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
  - claude-sonnet-4.6
  - gpt-5.4-mini
  - gpt-5.4
  - claude-opus-4.6

Admin UI: http://0.0.0.0:4000/ui
```

### 9.5 Configurer Claude Code

#### settings.json pour Copilot via LiteLLM :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "github_copilot/claude-sonnet-4.6",
    "ANTHROPIC_SMALL_FAST_MODEL": "github_copilot/gpt-5.4-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "deny": ["WebSearch"]
  }
}
```

#### settings.json pour Gemini Code Assist via LiteLLM :
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4000",
    "ANTHROPIC_AUTH_TOKEN": "sk-litellm-static-key",
    "ANTHROPIC_MODEL": "gemini-3.1-pro",
    "ANTHROPIC_SMALL_FAST_MODEL": "gemini-3-flash",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "deny": ["WebSearch"]
  }
}
```

### 9.6 Interface d'administration

LiteLLM inclut un dashboard web à `http://localhost:4000/ui` où vous pouvez :
- Voir les requêtes en temps réel
- Surveiller la consommation de tokens
- Gérer les modèles
- Voir les erreurs

---

## 10. MÉTHODE 2quater : claude-copilot-proxy en Go

**Repo** : https://github.com/acheong08/claude-copilot-proxy
**Difficulté** : Moyenne
**Temps** : 5 minutes
**Avantage** : Léger, rapide, un seul binaire

### 10.1 Cloner et lancer

```bash
git clone https://github.com/acheong08/claude-copilot-proxy.git
cd claude-copilot-proxy
```

### 10.2 Obtenir un token Copilot

Vous avez besoin d'un token d'API Copilot (pas le token GitHub classique).
Utilisez un autre outil pour l'obtenir :

```bash
# Méthode rapide avec copilot-api
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

## 11. MÉTHODE 3 : cc-copilot-bridge (multi-provider)

**Repo** : https://github.com/FlorianBruniaux/cc-copilot-bridge
**Difficulté** : Facile
**Temps** : 2 minutes
**Avantage** : Bascule instantanée entre Copilot, Anthropic Direct et Ollama local

### 11.1 Concept

cc-copilot-bridge est un routeur multi-provider pour Claude Code CLI. Au lieu d'être verrouillé sur un seul backend, vous basculez entre trois providers avec des aliases :

| Alias | Provider | Backend | Coût |
|-------|----------|---------|------|
| `ccc` | GitHub Copilot | copilot-api (port 4141) | Quota Copilot |
| `ccd` | Anthropic Direct | API Anthropic | Pay-per-token |
| `cco` | Ollama Local | Modèles locaux | Gratuit / offline |

### 11.2 Installation

```bash
# Via Homebrew (recommandé)
brew tap FlorianBruniaux/tap
brew install cc-copilot-bridge
eval "$(claude-switch --shell-config)"

# Via script d'installation
curl -fsSL https://raw.githubusercontent.com/FlorianBruniaux/cc-copilot-bridge/main/install.sh | bash

# Debian/Ubuntu : téléchargez le .deb depuis les releases GitHub
# RHEL/Fedora : téléchargez le .rpm depuis les releases GitHub
```

### 11.3 Utilisation

```bash
# Lancer Claude Code via Copilot (le plus courant)
ccc

# Changer de modèle à la volée
COPILOT_MODEL=gpt-5.4 ccc          # GPT-5.4 (quota gratuit)
COPILOT_MODEL=claude-opus-4.6 ccc  # Claude Opus 4.6

# Basculer sur Anthropic Direct (clé API requise)
ccd

# Mode hors-ligne avec Ollama
cco

# Vérifier la santé des providers
ccs
```

### 11.4 Fonctionnalités avancées

- **40+ modèles** : Claude, GPT, Gemini et modèles de codage spécialisés
- **Health checks** : validation de la disponibilité avant lancement
- **Profils MCP restreints** : génération automatique pour les modèles avec validation JSON stricte (ex: GPT-5.4)
- **Injection d'identité** : les modèles non-Claude s'identifient correctement (ex: "GPT-5.4 by OpenAI")
- **Logging** : sessions enregistrées dans `~/.claude/claude-switch.log`

### 11.5 Prérequis

- **Copilot** (`ccc`) : copilot-api doit tourner sur le port 4141
- **Anthropic** (`ccd`) : variable `ANTHROPIC_API_KEY` configurée
- **Ollama** (`cco`) : Ollama installé, 32 Go RAM minimum recommandés

---

## 12. MÉTHODE 3bis : copilot-api fork Anthropic-first

**Repo** : https://github.com/caozhiyuan/copilot-api (branche `all`)
**Package** : `npx @jeffreycao/copilot-api@latest`
**Difficulté** : Facile
**Temps** : 2 minutes
**Avantage** : Routage natif Anthropic Messages API, meilleur pour Claude Code

### 12.1 Pourquoi ce fork ?

Le fork de caozhiyuan améliore le copilot-api original avec :

| Fonctionnalité | Original (ericc-ch) | Fork (caozhiyuan) |
|---------------|--------------------|--------------------|
| API Claude | Via traduction Chat completions | **Natif Messages API** (`/v1/messages`) |
| Token counting | Estimation GPT tokenizer | **Exact via endpoint Anthropic** |
| Thinking/tool_use | Conversion lossy | **Préservé nativement** |
| Requêtes premium | Standard | **Optimisé** (warmup → smallModel) |
| Sous-agents | Non | **Oui** (marker injection) |

### 12.2 Installation et lancement

```bash
# Lancement rapide (comme l'original, mais avec le fork)
npx @jeffreycao/copilot-api@latest start --claude-code

# Avec options avancées
npx @jeffreycao/copilot-api@latest start \
  --account-type individual \
  --rate-limit 20 --wait
```

### 12.3 Configuration Claude Code

Identique à la méthode 1, pointez Claude Code vers `localhost:4141` :

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "claude-sonnet-4.6",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-5.4-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### 12.4 Quand utiliser ce fork ?

- Vous utilisez principalement des **modèles Claude** via Copilot
- Vous avez besoin du **thinking/extended thinking** natif
- Vous voulez un **comptage de tokens exact**
- Vous utilisez les **sous-agents** de Claude Code

---

## 13. Configuration permanente de Claude Code

Au lieu de taper les variables d'environnement à chaque fois, configurez-les une fois.

### 13.1 Configuration globale (pour tous les projets)

Éditez `~/.claude/settings.json` :

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

**Sur Windows**, le chemin est :
```
C:\Users\VOTRE_USER\.claude\settings.json
```

### 13.2 Configuration par projet

Créez `.claude/settings.json` à la racine de votre projet :

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:4141",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_MODEL": "gpt-5.4",
    "ANTHROPIC_SMALL_FAST_MODEL": "gpt-5.4-mini",
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

### 13.3 Via les variables d'environnement du shell

Ajoutez dans votre `~/.bashrc`, `~/.zshrc`, ou profil PowerShell :

```bash
# ~/.bashrc ou ~/.zshrc
export ANTHROPIC_BASE_URL="http://localhost:4141"
export ANTHROPIC_AUTH_TOKEN="dummy"
export ANTHROPIC_MODEL="gpt-5.4"
export ANTHROPIC_SMALL_FAST_MODEL="gpt-5.4-mini"
export DISABLE_NON_ESSENTIAL_MODEL_CALLS="1"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
```

```powershell
# PowerShell ($PROFILE)
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
$env:ANTHROPIC_AUTH_TOKEN = "dummy"
$env:ANTHROPIC_MODEL = "gpt-5.4"
$env:ANTHROPIC_SMALL_FAST_MODEL = "gpt-5.4-mini"
$env:DISABLE_NON_ESSENTIAL_MODEL_CALLS = "1"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
```

---

## 14. Gestion du proxy entreprise (HTTP_PROXY)

En entreprise, l'accès internet passe souvent par un proxy HTTP.

### 14.1 Configurer npm

```bash
npm config set proxy http://proxy.entreprise.fr:8080
npm config set https-proxy http://proxy.entreprise.fr:8080

# Avec authentification
npm config set proxy http://user:pass@proxy.entreprise.fr:8080
npm config set https-proxy http://user:pass@proxy.entreprise.fr:8080

# Vérifier
npm config get proxy
npm config get https-proxy
```

### 14.2 Configurer git

```bash
git config --global http.proxy http://proxy.entreprise.fr:8080
git config --global https.proxy http://proxy.entreprise.fr:8080
```

### 14.3 Configurer le proxy copilot-api

```bash
# Option 1 : flag --proxy-env (utilise HTTP_PROXY du système)
npx copilot-api@latest start --proxy-env

# Option 2 : variables d'environnement explicites
export HTTP_PROXY=http://proxy.entreprise.fr:8080
export HTTPS_PROXY=http://proxy.entreprise.fr:8080
export NO_PROXY=localhost,127.0.0.1
npx copilot-api@latest start
```

### 14.4 Configurer pip (pour LiteLLM)

```bash
pip install --proxy http://proxy.entreprise.fr:8080 litellm[proxy]

# Ou dans pip.conf
# Linux: ~/.config/pip/pip.conf
# Windows: %APPDATA%\pip\pip.ini
[global]
proxy = http://proxy.entreprise.fr:8080
```

### 14.5 Certificats SSL auto-signés (fréquent en entreprise)

Si vous avez des erreurs SSL `UNABLE_TO_VERIFY_LEAF_SIGNATURE` :

```bash
# Pour Node.js (copilot-api, claude code)
export NODE_TLS_REJECT_UNAUTHORIZED=0
# ⚠️ Désactive la vérification SSL - utilisez uniquement en dev

# Meilleure solution : ajouter le certificat racine de l'entreprise
export NODE_EXTRA_CA_CERTS=/chemin/vers/certificat-entreprise.pem

# Pour Python (LiteLLM)
export REQUESTS_CA_BUNDLE=/chemin/vers/certificat-entreprise.pem
# Ou :
export SSL_CERT_FILE=/chemin/vers/certificat-entreprise.pem
```

### 14.6 Fichier PAC / WPAD (auto-configuration)

Si votre entreprise utilise un fichier PAC (Proxy Auto-Configuration) :

```bash
# Trouver l'URL du fichier PAC
# Windows (PowerShell)
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" | Select-Object AutoConfigURL

# macOS / Linux
echo $auto_proxy
# Ou cherchez dans les paramètres réseau du système
```

Le fichier PAC retourne le proxy à utiliser selon l'URL cible. Extrayez l'adresse du proxy pour les domaines GitHub :

```bash
# Typiquement, le PAC contient une règle comme :
# if (shExpMatch(host, "*.github.com")) return "PROXY proxy.entreprise.fr:8080"

# Utilisez cette adresse comme HTTP_PROXY
export HTTP_PROXY=http://proxy.entreprise.fr:8080
export HTTPS_PROXY=http://proxy.entreprise.fr:8080
```

### 14.7 Authentification NTLM / Kerberos

Les proxys d'entreprise Windows utilisent souvent NTLM ou Kerberos. Node.js ne supporte pas nativement ces protocoles.

**Solution : Cntlm (proxy relais local)**

```bash
# 1. Installer Cntlm
# Windows : téléchargez depuis https://cntlm.sourceforge.net/
# Ubuntu/Debian :
sudo apt install cntlm
# macOS :
brew install cntlm

# 2. Configurer /etc/cntlm.conf (ou C:\Program Files\Cntlm\cntlm.ini)
Username    votre-login
Domain      VOTRE-DOMAINE
Proxy       proxy-entreprise.fr:8080
Listen      127.0.0.1:3128

# 3. Générer le hash du mot de passe (ne stockez jamais en clair)
cntlm -H -d VOTRE-DOMAINE -u votre-login

# 4. Copier les hashes dans cntlm.conf :
# PassNTLMv2  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# 5. Démarrer Cntlm
sudo systemctl start cntlm   # Linux
net start cntlm              # Windows (service)

# 6. Utiliser Cntlm comme proxy local (sans auth)
export HTTP_PROXY=http://127.0.0.1:3128
export HTTPS_PROXY=http://127.0.0.1:3128
```

### 14.8 Domaines et IP à autoriser (whitelist firewall)

Si votre équipe réseau doit ouvrir des règles de firewall, voici les domaines nécessaires :

**GitHub Copilot :**

| Domaine | Port | Usage |
|---------|------|-------|
| `github.com` | 443 | Authentification OAuth |
| `api.github.com` | 443 | API REST GitHub |
| `api.individual.githubcopilot.com` | 443 | API Copilot (modèles) |
| `copilot-proxy.githubusercontent.com` | 443 | Proxy Copilot |
| `default.exp-tas.com` | 443 | Telemetry GitHub |
| `registry.npmjs.org` | 443 | Installation des packages npm |
| `objects.githubusercontent.com` | 443 | Téléchargement d'assets GitHub |

**Google Gemini Code Assist :**

| Domaine | Port | Usage |
|---------|------|-------|
| `generativelanguage.googleapis.com` | 443 | API Gemini (Google AI Studio) |
| `aiplatform.googleapis.com` | 443 | API Vertex AI (entreprise) |
| `oauth2.googleapis.com` | 443 | Authentification Google OAuth |
| `accounts.google.com` | 443 | Login Google |
| `storage.googleapis.com` | 443 | Stockage Google Cloud (optionnel) |

**Commun :**

| Domaine | Port | Usage |
|---------|------|-------|
| `localhost` / `127.0.0.1` | 4141, 4399, 4000 | Proxy local (ne pas bloquer) |

```bash
# Ajoutez ces domaines dans NO_PROXY pour éviter de boucler via le proxy corporate
export NO_PROXY=localhost,127.0.0.1,::1
```

### 14.9 Configuration proxy sous Windows (PowerShell)

```powershell
# Variables d'environnement (session courante)
$env:HTTP_PROXY = "http://proxy.entreprise.fr:8080"
$env:HTTPS_PROXY = "http://proxy.entreprise.fr:8080"
$env:NO_PROXY = "localhost,127.0.0.1"

# Permanent (utilisateur courant)
[Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://proxy.entreprise.fr:8080", "User")
[Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://proxy.entreprise.fr:8080", "User")
[Environment]::SetEnvironmentVariable("NO_PROXY", "localhost,127.0.0.1", "User")

# Certificat SSL custom
$env:NODE_EXTRA_CA_CERTS = "C:\Certificats\ca-entreprise.pem"

# Avec authentification NTLM (via Cntlm)
$env:HTTP_PROXY = "http://127.0.0.1:3128"
$env:HTTPS_PROXY = "http://127.0.0.1:3128"
```

### 14.10 Configuration proxy sous WSL2

WSL2 ne hérite pas automatiquement du proxy Windows :

```bash
# Récupérer l'IP de l'hôte Windows depuis WSL2
WIN_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')

# Si Cntlm tourne sur Windows
export HTTP_PROXY=http://${WIN_HOST}:3128
export HTTPS_PROXY=http://${WIN_HOST}:3128
export NO_PROXY=localhost,127.0.0.1

# Ajouter dans ~/.bashrc ou ~/.zshrc pour persister
echo "export HTTP_PROXY=http://\$(cat /etc/resolv.conf | grep nameserver | awk '{print \$2}'):3128" >> ~/.bashrc
echo "export HTTPS_PROXY=\$HTTP_PROXY" >> ~/.bashrc
echo "export NO_PROXY=localhost,127.0.0.1" >> ~/.bashrc

# Certificat SSL (copier depuis Windows)
cp /mnt/c/Certificats/ca-entreprise.pem ~/ca-entreprise.pem
export NODE_EXTRA_CA_CERTS=~/ca-entreprise.pem
```

### 14.11 Diagnostic de connectivité

Commandes pour vérifier que tout fonctionne à travers le proxy :

```bash
# 1. Tester l'accès à GitHub via le proxy
curl -v --proxy http://proxy.entreprise.fr:8080 https://api.github.com/zen

# 2. Tester l'accès à l'API Copilot
curl -v --proxy http://proxy.entreprise.fr:8080 https://api.individual.githubcopilot.com

# 3. Vérifier que npm passe par le proxy
npm config list
npm ping

# 4. Vérifier les variables d'environnement
env | grep -i proxy

# 5. Tester la résolution DNS
nslookup api.individual.githubcopilot.com

# 6. Tester le proxy local (copilot-api)
curl http://localhost:4141/v1/models

# 7. Vérifier le certificat SSL
openssl s_client -connect api.github.com:443 -proxy proxy.entreprise.fr:8080

# Windows (PowerShell)
Test-NetConnection -ComputerName api.github.com -Port 443
```

### 14.12 Chaîne de proxys (proxy derrière un proxy)

Dans certaines architectures, le proxy copilot-api doit lui-même passer par le proxy corporate :

```
Claude Code → copilot-api (localhost:4141) → proxy corporate (8080) → Internet → GitHub Copilot API
```

```bash
# Lancer copilot-api avec le proxy corporate
HTTP_PROXY=http://proxy.entreprise.fr:8080 \
HTTPS_PROXY=http://proxy.entreprise.fr:8080 \
NO_PROXY=localhost,127.0.0.1 \
npx copilot-api@latest start --proxy-env

# Claude Code pointe vers le proxy local (pas le corporate !)
# Dans settings.json :
# "ANTHROPIC_BASE_URL": "http://localhost:4141"
# Ne PAS mettre HTTP_PROXY dans les env de Claude Code
```

> **Important** : Claude Code doit pointer vers `localhost:4141` (le proxy local), PAS vers le proxy corporate. Seul copilot-api a besoin du proxy corporate pour atteindre Internet.

---

## 15. Optimisation du quota Copilot

Claude Code est TRÈS gourmand en tokens. Une session de 30 minutes peut
consommer autant qu'une journée de Copilot Chat.

### 15.1 Variables d'environnement essentielles

```bash
# Réduit les appels en arrière-plan (completions, suggestions)
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1

# Désactive le trafic non-essentiel (télémétrie, checks)
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

**Ces deux variables sont OBLIGATOIRES.** Sans elles, Claude Code fait
des dizaines d'appels supplémentaires que vous ne voyez pas.

### 15.2 Rate limiting sur le proxy

```bash
# Attendre 30 secondes minimum entre chaque requête
npx copilot-api@latest start --rate-limit 30 --wait

# --wait : au lieu d'une erreur 429, le proxy attend puis réessaie
# Sans --wait : vous recevez une erreur et devez relancer
```

### 15.3 Choisir le bon modèle

| Modèle | Tokens/requête | Qualité | Recommandation |
|--------|---------------|---------|----------------|
| gpt-5.4-mini | Faible | Correcte | Modèle rapide, tâches simples |
| gpt-5.4 | Moyen | Bonne | Bon équilibre |
| claude-sonnet-4.6 | Moyen | Très bonne | Meilleur pour le code |
| claude-opus-4.6 | Élevé | Excellente | Tâches complexes uniquement |

**Recommandation :**
- `ANTHROPIC_MODEL=gpt-5.4` (principal)
- `ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini` (tâches légères)

### 15.4 Bonnes pratiques

1. **Soyez précis** : "corrige le bug ligne 42 de server.js" consomme moins que "corrige les bugs"
2. **Évitez les sessions longues** : fermez et relancez Claude Code régulièrement
3. **Surveillez le quota** : `npx copilot-api@latest check-usage`
4. **Utilisez /compact** dans Claude Code pour compresser le contexte
5. **Désactivez WebSearch** : chaque recherche web = requêtes supplémentaires inutiles

---

## 16. Modèles disponibles et lequel choisir

Les modèles disponibles dépendent de votre licence Copilot.

### 16.1 Modèles courants via GitHub Copilot

| Modèle | Fournisseur | Forces |
|--------|-------------|--------|
| `gpt-5.4` | OpenAI | Polyvalent, bon en code |
| `gpt-5.4-mini` | OpenAI | Rapide, économique |
| `gpt-5.2` | OpenAI | Multimodal |
| `gpt-5-mini` | OpenAI | Très rapide |
| `claude-sonnet-4.6` | Anthropic | Excellent en code, raisonnement |
| `claude-opus-4.6` | Anthropic | Le plus puissant mais lent |
| `claude-haiku-4.5` | Anthropic | Rapide, économique |
| `o3` | OpenAI | Raisonnement avancé |

### 16.1bis Modèles courants via Gemini Code Assist

| Modèle | Forces | Contexte max |
|--------|--------|-------------|
| `gemini-3.1-pro` | Raisonnement avancé, excellent en code, multimodal | 1M tokens |
| `gemini-3-flash` | Rapide, économique, multimodal | 1M tokens |
| `gemini-3.1-flash-lite` | Ultra rapide, latence minimale, gratuit dans les quotas de base | 1M tokens |

> **Avantage Gemini** : contexte de 1 million de tokens, idéal pour les gros codebases.
> **Avantage Copilot** : plus de choix de modèles (GPT, Claude, o3).

### 16.2 Voir les modèles disponibles

```bash
# Via copilot-api (GitHub Copilot)
curl http://localhost:4141/v1/models | jq

# Via LiteLLM (Copilot ou Gemini)
curl http://localhost:4000/v1/models | jq

# Via le navigateur
# Ouvrez http://localhost:4141/v1/models ou http://localhost:4000/v1/models
```

### 16.3 Combinaisons recommandées

**GitHub Copilot — dev quotidien :**
```
ANTHROPIC_MODEL=gpt-5.4
ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini
```

**GitHub Copilot — qualité maximale :**
```
ANTHROPIC_MODEL=claude-sonnet-4.6
ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini
```

**GitHub Copilot — économiser le quota :**
```
ANTHROPIC_MODEL=gpt-5.4-mini
ANTHROPIC_SMALL_FAST_MODEL=gpt-5.4-mini
```

**Gemini Code Assist — dev quotidien :**
```
ANTHROPIC_MODEL=gemini-3.1-pro
ANTHROPIC_SMALL_FAST_MODEL=gemini-3-flash
```

**Gemini Code Assist — économiser le quota :**
```
ANTHROPIC_MODEL=gemini-3-flash
ANTHROPIC_SMALL_FAST_MODEL=gemini-3.1-flash-lite
```

**Gemini Code Assist — gros codebase (contexte 1M) :**
```
ANTHROPIC_MODEL=gemini-3.1-pro
ANTHROPIC_SMALL_FAST_MODEL=gemini-3-flash
```
> Gemini 3.1 Pro gère nativement 1M tokens de contexte, idéal pour analyser
> de grands projets d'un coup.

---

## 17. Dépannage complet

### 17.1 Erreurs de connexion

**`ECONNREFUSED localhost:4141`**
```
Cause : le proxy n'est pas lancé
Solution : vérifiez que le proxy tourne dans un autre terminal
  npx copilot-api@latest start
```

**`ECONNRESET` ou `socket hang up`**
```
Cause : le proxy a crashé
Solution : relancez le proxy, ajoutez --verbose pour voir les logs
```

**`ETIMEDOUT` vers api.github.com**
```
Cause : le proxy entreprise bloque la connexion
Solution :
  export HTTP_PROXY=http://proxy.entreprise.fr:8080
  export HTTPS_PROXY=http://proxy.entreprise.fr:8080
  npx copilot-api@latest start --proxy-env
```

### 17.2 Erreurs d'authentification

**`401 Unauthorized`**
```
Cause : token expiré ou invalide
Solution : relancez l'authentification
  npx copilot-api@latest auth
```

**`403 Forbidden` (Copilot)**
```
Cause : licence Copilot inactive ou modèle non autorisé
Solution :
  1. Vérifiez https://github.com/settings/copilot
  2. Essayez un autre modèle (gpt-5.2 au lieu de claude-sonnet-4.6)
  3. Vérifiez --account-type (individual/business/enterprise)
```

**`403 Permission Denied` ou `API key not valid` (Gemini)**
```
Cause : clé API invalide ou quota Google Cloud épuisé
Solution :
  1. Vérifiez votre clé : echo $GEMINI_API_KEY
  2. Régénérez sur https://aistudio.google.com/apikey
  3. Si Vertex AI : gcloud auth application-default login
  4. Vérifiez les quotas sur https://console.cloud.google.com/apis/dashboard
```

**Le device code expire avant que je puisse l'entrer**
```
Cause : le navigateur ne s'ouvre pas automatiquement
Solution : copiez manuellement l'URL et le code affichés
```

### 17.3 Erreurs de modèle

**`thinking parameter not supported`**
```
Cause : Claude Code envoie un paramètre que Copilot ne comprend pas
Solution :
  - Avec copilot-api/copilot-proxy : normalement gère automatiquement, mettez à jour
  - Avec LiteLLM : ajoutez drop_params: true dans la config YAML
```

**`model not found` ou `model not available`**
```
Cause : le modèle demandé n'est pas disponible sur votre licence
Solution :
  1. curl http://localhost:4141/v1/models pour voir les modèles dispo
  2. Changez ANTHROPIC_MODEL pour un modèle disponible
```

### 17.4 Erreurs de quota

**`429 Too Many Requests`**
```
Cause : trop de requêtes en peu de temps
Solution :
  npx copilot-api@latest start --rate-limit 30 --wait
  (30 secondes minimum entre les requêtes, attend au lieu d'erreur)
```

**Quota mensuel épuisé**
```
Cause : Claude Code consomme beaucoup de tokens
Solution :
  1. Attendez le renouvellement du quota
  2. Utilisez des modèles plus légers (gpt-5.4-mini)
  3. Activez DISABLE_NON_ESSENTIAL_MODEL_CALLS=1
  4. npx copilot-api@latest check-usage pour surveiller
```

### 17.5 Problèmes Windows spécifiques

**`command not found: npx`**
```
Solution : Node.js n'est pas dans le PATH
  1. Réinstallez Node.js avec l'option "Add to PATH"
  2. Ou ajoutez manuellement : set PATH=%PATH%;C:\Program Files\nodejs
```

**Les scripts bash ne marchent pas (launch.sh)**
```
Solution : utilisez Git Bash, WSL, ou lancez manuellement les commandes
  node src/proxy.mjs   (terminal 1)
  claude                (terminal 2)
```

**Problème de droits d'exécution npm global**
```
Solution :
  npm config set prefix %USERPROFILE%\.npm-global
  set PATH=%PATH%;%USERPROFILE%\.npm-global
```

---

## 18. Sécurité et risques

> **Note (février 2026)** : GitHub a officiellement lancé Claude et Codex comme agents de codage pour Copilot Business et Pro. À terme, ces proxies non-officiels pourraient devenir inutiles si l'intégration native couvre votre cas d'usage. Consultez https://github.blog/changelog/2026-02-26-claude-and-codex-now-available-for-copilot-business-pro-users/

### 18.1 API non-officielle vs officielle

**GitHub Copilot** : les proxies Node.js utilisent des API **reverse-engineered** de GitHub Copilot.
Ce n'est PAS un usage supporté officiellement par GitHub.

**Risques Copilot :**
- Suspension temporaire de l'accès Copilot en cas d'abus détecté
- Les API peuvent changer sans préavis (mise à jour du proxy nécessaire)
- Pas de support officiel en cas de problème

**Google Gemini Code Assist** : via LiteLLM, vous utilisez l'**API officielle** de Google
(Google AI Studio ou Vertex AI). C'est un usage **supporté et documenté**.

**Avantages Gemini :**
- API officielle et stable
- Pas de risque de suspension
- Support Google Cloud en cas de problème
- Quotas gratuits généreux (Google AI Studio)

### 18.2 Bonnes pratiques de sécurité

1. **Ne commitez JAMAIS vos tokens** : ajoutez à `.gitignore` :
   ```
   .claude-copilot-auth.json
   .copilot-api/
   ```

2. **Le proxy écoute en local uniquement** : par défaut sur `localhost`/`127.0.0.1`.
   Ne l'exposez JAMAIS sur `0.0.0.0` en entreprise.

3. **Le token `ANTHROPIC_AUTH_TOKEN=dummy`** n'est pas un vrai token.
   Les proxies acceptent n'importe quelle valeur car l'auth se fait côté GitHub.

4. **Surveillez les mises à jour** des proxies pour les correctifs de sécurité.

### 18.3 Conformité entreprise

Avant d'utiliser ces outils en entreprise :
- **Copilot** : Vérifiez les conditions d'utilisation de votre licence GitHub Copilot. L'utilisation de proxies non-officiels peut violer les ToS de GitHub
- **Gemini** : Vérifiez que votre entreprise autorise l'utilisation de Google Cloud / Vertex AI. L'API Gemini est officielle et documentée
- Consultez votre équipe sécurité/conformité
- Les données de code transitent par les serveurs de GitHub/OpenAI (Copilot) ou Google (Gemini)

---

## 19. Tableau comparatif final

| Critère | copilot-api (npx) | copilot-proxy (npx) | LM Proxy (VS Code) | claude-code-copilot (clone) | LiteLLM (pip) | Go proxy (clone) | cc-copilot-bridge | copilot-api fork |
|---------|-------------------|---------------------|---------------------|----------------------------|---------------|-------------------|-------------------|-----------------|
| **Difficulté** | Facile | Facile | Très facile | Facile | Moyenne | Moyenne | Facile | Facile |
| **Temps install** | 2 min | 3 min | 1 min | 3 min | 5 min | 5 min | 2 min | 2 min |
| **npm/npx** | Oui | Oui | Non | Non | Non | Non | Homebrew/script | Oui |
| **Dépendances** | Node.js | Node.js | VS Code | Node.js seul | Python | Go | Bash + copilot-api | Node.js |
| **Mode daemon** | Non | Oui | Via VS Code | Non | Non | Non | Non | Non |
| **Auth auto** | Oui | Oui | Via VS Code | Oui | Manuelle | Manuelle | Via copilot-api | Oui |
| **Rate limiting** | Oui | Oui | Non | Non | Via config | Non | Via copilot-api | Oui |
| **Recherche web** | Non | Non | Non | Oui (DuckDuckGo) | Non | Non | Non | Non |
| **Dashboard** | Non | Non | Non | Non | Oui (web UI) | Non | Non | Oui (web) |
| **Multi-provider** | Non | Non | Non | Non | **Oui** (100+ providers) | Non | **Oui** (3 backends) | Non |
| **API Anthropic native** | Oui | Non | Non | Non | Non | Non | Via backend | **Oui (prioritaire)** |
| **Port défaut** | 4141 | 4399 | 4000 | 18080 | 4000 | 8082 | Via backend | 4141 |
| **Communauté** | Grande | Moyenne | Petite | Petite | Grande | Petite | Nouvelle | Moyenne |
| **Maintenance** | Active | Active | Active | Active | Active | Faible | Active | Active |

---

## Recommandation finale

| Situation | Solution recommandée |
|-----------|---------------------|
| Je veux que ça marche vite (Copilot) | copilot-api avec `npx` (méthode 1) |
| Je veux que ça marche vite (Gemini) | LiteLLM + gemini-config.yaml (méthode 2ter) |
| Je veux un service permanent | copilot-proxy avec daemon (méthode 1bis) |
| VS Code est toujours ouvert | LM Proxy extension (méthode 1ter) |
| npx est bloqué dans mon entreprise | claude-code-copilot clone (méthode 2bis) |
| Je veux du contrôle total | LiteLLM (méthode 2ter) |
| J'ai Copilot ET Gemini | LiteLLM avec mixed-config.yaml (méthode 2ter) |
| Je suis développeur Go | claude-copilot-proxy (méthode 2quater) |
| Je veux basculer entre providers | cc-copilot-bridge (méthode 3) |
| J'utilise surtout Claude via Copilot | copilot-api fork Anthropic-first (méthode 3bis) |
| Mon entreprise a Copilot Business/Pro | Vérifiez d'abord l'intégration officielle Claude/Copilot |
| J'ai besoin d'un contexte 1M tokens | Gemini 3.1 Pro via LiteLLM (méthode 2ter) |
