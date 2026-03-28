# Quick Start : Claude Code via Copilot en 5 minutes

---

## Pre-requis

```bash
node --version    # >= 18 requis
npm --version     # doit fonctionner
```

Si Node.js n'est pas installé :
```bash
# Via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Ou téléchargez sur https://nodejs.org
```

---

## Étape 1 : Installer Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Vérifiez :
```bash
claude --version
```

---

## Étape 2 : Lancer le proxy

Ouvrez un terminal et lancez :

```bash
npx copilot-api@latest start --claude-code
```

Ce qui se passe :
1. Le proxy démarre sur le port 4141
2. Un code s'affiche : `Entrez ce code sur GitHub : XXXX-XXXX`
3. Votre navigateur s'ouvre sur github.com/login/device
4. Entrez le code, autorisez
5. Le proxy vous demande de choisir 2 modèles
6. Une commande est copiée dans votre presse-papier

---

## Étape 3 : Lancer Claude Code

Ouvrez un **2e terminal** et collez la commande du presse-papier. Elle ressemble à :

```bash
ANTHROPIC_BASE_URL=http://localhost:4141 \
ANTHROPIC_AUTH_TOKEN=dummy \
ANTHROPIC_MODEL=gpt-4.1 \
ANTHROPIC_SMALL_FAST_MODEL=gpt-4.1-mini \
DISABLE_NON_ESSENTIAL_MODEL_CALLS=1 \
claude
```

---

## C'est prêt !

Claude Code est maintenant connecté a Copilot. Tapez vos commandes normalement.

---

## Pour les prochaines fois

```bash
# Terminal 1 : relancez le proxy (le token est sauvegardé)
npx copilot-api@latest start

# Terminal 2 : lancez claude avec la config
claude
```

Si vous avez configure `.claude/settings.json` (voir ci-dessous), vous n'avez plus
besoin des variables d'environnement a chaque fois.

---

## Configuration permanente (optionnel mais recommandé)

Créez le fichier `~/.claude/settings.json` :

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

Après ça, il suffit de :
```bash
# Terminal 1
npx copilot-api@latest start

# Terminal 2
claude
```

---

## Dépannage rapide

| Probleme | Solution |
|----------|----------|
| `ECONNREFUSED` | Le proxy n'est pas lance (terminal 1) |
| `401 Unauthorized` | Relancez `npx copilot-api@latest auth` |
| `thinking parameter error` | Normal avec LiteLLM, ajoutez `drop_params: true` |
| Quota epuise rapidement | Ajoutez `--rate-limit 30 --wait` au proxy |
| Proxy entreprise bloqué | Ajoutez `--proxy-env` au proxy |
