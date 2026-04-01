# DevPassport

**Gardez vos outils, utilisez votre abonnement** -- Guide interactif pour intégrer Claude Code avec GitHub Copilot via des proxys locaux.

> **[Accéder au site](https://anas-zahouri.github.io/ai-dev-bridge/)**

## Contenu

Ce projet propose une documentation complète en français pour les développeurs en entreprise qui disposent uniquement d'un accès GitHub Copilot et souhaitent utiliser Claude Code.

- **[Quickstart](QUICKSTART_CLAUDE_COPILOT.md)** -- Démarrage en 5 minutes
- **[Manuel complet](MANUEL_CLAUDE_CODE_COPILOT.md)** -- 6 méthodes de proxy détaillées
- **[Guide technique](GUIDE_DETAILLE_CLAUDE_COPILOT.md)** -- Architecture, diagrammes et configurations avancées

## Site interactif

Le site est déployé via GitHub Pages :

**https://anas-zahouri.github.io/ai-dev-bridge/**

Il s'agit d'une application statique (HTML/CSS/JS, sans framework ni build) avec navigation SPA, scroll spy et thème sombre/clair.

## Développement

```bash
# Servir localement
npx http-server docs/ -p 8080

# Lancer les tests Playwright
cd docs/ && npm install && node test-site.mjs
```

## Auteur

**Anas ZAHOURI** -- [LinkedIn](https://www.linkedin.com/in/anaszahouri/) | [GitHub](https://github.com/Anas-ZAHOURI)

## Licence

Ce projet est mis à disposition à des fins éducatives et documentaires.
