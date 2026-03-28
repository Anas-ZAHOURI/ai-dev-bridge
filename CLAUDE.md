# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Documentation and interactive guide website for integrating Claude Code with GitHub Copilot via local proxy bridges. Targets French-speaking enterprise developers who only have GitHub Copilot access but want to use Claude Code. All documentation and UI text is in **French**.

## Architecture

Three static documentation websites (`docs/`, `docs-comparaison/`, `docs-opencode/`) with nearly identical structure, plus three standalone Markdown guides at the root.

Each site is a vanilla HTML/CSS/JS single-page application (no frameworks, no build tools):
- **Multi-page SPA**: Pages switched via JS (`showPage(pageId)`), no full reloads
- **Fixed layout**: Dark header (#1a1a1a, 60px) + fixed sidebar (280px) + scrollable main content
- **Features**: Scroll spy, code copy buttons, tab switching, mobile hamburger menu
- **CSS variables**: Accent red `#e60028`, fonts Inter + JetBrains Mono
- **Responsive**: Desktop fixed sidebar, mobile slide-in sidebar

Root Markdown guides mirror the HTML content:
- `QUICKSTART_CLAUDE_COPILOT.md` — 5-minute setup
- `MANUEL_CLAUDE_CODE_COPILOT.md` — Complete manual with 6 proxy methods
- `GUIDE_DETAILLE_CLAUDE_COPILOT.md` — Deep technical guide with architecture diagrams

## Commands

```bash
# Install test dependencies (per site)
cd docs/          # or docs-comparaison/ or docs-opencode/
npm install

# Run Playwright tests for a site
node test-site.mjs

# Serve locally (any static server works)
npx http-server . -p 8080
python -m http.server 8080
```

There is no build step — files are served directly as static assets.

## Testing

Each site has a `test-site.mjs` using Playwright that tests:
- Page navigation between sections
- Sidebar scroll spy highlighting
- Copy-to-clipboard buttons
- Responsive layout (1280x800 viewport)
- Tab switching

## Development Workflow

When updating documentation content:
1. Update the root `.md` file
2. Mirror changes into the corresponding `index.html` section(s) in `docs/`, `docs-comparaison/`, and/or `docs-opencode/`
3. Run `node test-site.mjs` in affected site directories

The three sites share the same structure but differ in content focus (main guide vs comparison vs opencode variant). Changes to shared CSS/JS patterns should be applied across all three.

## Key CSS/JS Patterns

HTML pages use class-based page sections (`.page`), sidebar sections (`.sidebar-section`), and alert boxes (`.box-info`, `.box-danger`, `.box-success`, `.box-warning`). Code blocks have inline copy buttons. JS uses `IntersectionObserver` for scroll spy and `navigator.clipboard` for copy.
