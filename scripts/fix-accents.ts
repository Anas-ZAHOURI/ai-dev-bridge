import { readFileSync, writeFileSync } from "fs";
import { glob } from "fs/promises";

// Mapping of words without accents to their correct French form
// Order matters: longer patterns first to avoid partial matches
const replacements: [RegExp, string][] = [
  // Multi-word patterns
  [/arriere-plan/g, "arrière-plan"],
  [/auto-signes/g, "auto-signés"],
  [/mises a jour/g, "mises à jour"],
  [/mise a jour/g, "mise à jour"],
  [/mettre a jour/g, "mettre à jour"],
  [/mettez a jour/g, "mettez à jour"],
  [/a jour/g, "à jour"],
  [/a la main/g, "à la main"],
  [/ressemble a /g, "ressemble à "],
  [/Apres ca/g, "Après ça"],
  [/Comment ca marche/g, "Comment ça marche"],
  [/que ca marche/g, "que ça marche"],
  [/Appels a l/g, "Appels à l"],
  [/a inclure/g, "à inclure"],
  [/a l'API/g, "à l'API"],
  [/optionnel mais recommande/g, "optionnel mais recommandé"],
  [/C'est pret/g, "C'est prêt"],
  [/ou superieur/g, "ou supérieur"],
  [/n'est pas installe/g, "n'est pas installé"],

  // É/è/ê at start of words (capitalized)
  [/\bEtape\b/g, "Étape"],
  [/\bEvitez\b/g, "Évitez"],
  [/\bEditez\b/g, "Éditez"],

  // Words with é
  [/\btelemetrie\b/g, "télémétrie"],
  [/\btelechargez\b/g, "téléchargez"],
  [/\btelecharge\b/g, "télécharge"],
  [/\bsupplementaires?\b/g, (m: string) => m.replace("supplementaire", "supplémentaire")],
  [/\bReinstallez\b/g, "Réinstallez"],
  [/\bRedemarrer\b/g, "Redémarrer"],
  [/\bredemarrer\b/g, "redémarrer"],
  [/\bRedemarrage\b/g, "Redémarrage"],
  [/\bredemarrage\b/g, "redémarrage"],
  [/\bRecommandation\b/g, "Recommandation"],
  [/\brecommandees?\b/g, (m: string) => m.replace("recommandee", "recommandée")],
  [/\brecommande\b/g, "recommandé"],
  [/\brecupere\b/g, "récupère"],
  [/\breessaie\b/g, "réessaie"],
  [/\brepond\b/g, "répond"],
  [/\breponse\b/g, "réponse"],
  [/\breseau\b/g, "réseau"],
  [/\bresultat\b/g, "résultat"],
  [/\bReference\b/g, "Référence"],
  [/\breference\b/g, "référence"],
  [/\bproductivite\b/g, "productivité"],
  [/\bpreference\b/g, "préférence"],
  [/\bprefere\b/g, "préféré"],
  [/\bpreavis\b/g, "préavis"],
  [/\bnecessitent\b/g, "nécessitent"],
  [/\bnecessite\b/g, "nécessite"],
  [/\bnecessaire\b/g, "nécessaire"],
  [/\bNecessaire\b/g, "Nécessaire"],
  [/\bNecessite\b/g, "Nécessite"],
  [/\bmethodes?\b/g, (m: string) => m.replace("methode", "méthode")],
  [/\bMETHODES?\b/g, (m: string) => m.replace("METHODE", "MÉTHODE")],
  [/\bMethode\b/g, "Méthode"],
  [/\blegerement\b/g, "légèrement"],
  [/\blegers?\b/g, (m: string) => m.replace("leger", "léger")],
  [/\bLegers?\b/g, (m: string) => m.replace("Leger", "Léger")],
  [/\bintegrees?\b/g, (m: string) => m.replace("integree", "intégrée")],
  [/\bintegre\b/g, "intégré"],
  [/\bgerent\b/g, "gèrent"],
  [/\bGere\b/g, "Gère"],
  [/\bgere\b/g, "gère"],
  [/\bGerer\b/g, "Gérer"],
  [/\bgerer\b/g, "gérer"],
  [/\bequilibre\b/g, "équilibre"],
  [/\becoute\b/g, "écoute"],
  [/\beconomes?\b/g, (m: string) => m.replace("econome", "économe")],
  [/\bdependances?\b/g, (m: string) => m.replace("dependance", "dépendance")],
  [/\bDependances?\b/g, (m: string) => m.replace("Dependance", "Dépendance")],
  [/\bdetailles?\b/g, (m: string) => m.replace("detaille", "détaillé")],
  [/\bdetaillee\b/g, "détaillée"],
  [/\bdesactivez\b/g, "désactivez"],
  [/\bDesactive\b/g, "Désactive"],
  [/\bdesactive\b/g, "désactive"],
  [/\bDesactiver\b/g, "Désactiver"],
  [/\bdemarrer\b/g, "démarrer"],
  [/\bdemarrage\b/g, "démarrage"],
  [/\bdemarre\b/g, "démarre"],
  [/\bDemarrage\b/g, "Démarrage"],
  [/\bdeclencher\b/g, "déclencher"],
  [/\bdecrites?\b/g, (m: string) => m.replace("decrite", "décrite")],
  [/\bdefaut\b/g, "défaut"],
  [/\bDefaut\b/g, "Défaut"],
  [/\bDelai\b/g, "Délai"],
  [/\bdelai\b/g, "délai"],
  [/\bDepannage\b/g, "Dépannage"],
  [/\bdepannage\b/g, "dépannage"],
  [/\bderriere\b/g, "derrière"],
  [/\bdeja\b/g, "déjà"],
  [/\bconnait\b/g, "connaît"],
  [/\bconcu\b/g, "conçu"],
  [/\bcompletions\b/g, "complétions"],
  [/\bcomplete\b/g, "complète"],
  [/\bCreer\b/g, "Créer"],
  [/\bcreer\b/g, "créer"],
  [/\bCreez\b/g, "Créez"],
  [/\bcreez\b/g, "créez"],
  [/\bcopiee\b/g, "copiée"],
  [/\bconnecte\b/g, "connecté"],
  [/\bcles?\b/g, (m: string) => m.replace("cle", "clé")],
  [/\bbloque\b/g, "bloqué"],
  [/\bautorise\b/g, "autorisé"],
  [/\bVerifiez\b/g, "Vérifiez"],
  [/\bverifiez\b/g, "vérifiez"],
  [/\bVerifier\b/g, "Vérifier"],
  [/\bverifier\b/g, "vérifier"],
  [/\bTRES\b/g, "TRÈS"],
  [/\bTres\b/g, "Très"],
  [/\bsupporte\b(?=[ .])/g, "supporté"],
  [/\bSelectionnez\b/g, "Sélectionnez"],
  [/\bSecurite\b/g, "Sécurité"],
  [/\bsecurite\b/g, "sécurité"],
  [/\bReduit\b/g, "Réduit"],
  [/\breduit\b/g, "réduit"],
  [/\bProblemes\b/g, "Problèmes"],
  [/\bprobleme\b/g, "problème"],
  [/\bparallele\b/g, "parallèle"],
  [/\bparametres?\b/g, (m: string) => m.replace("parametre", "paramètre")],
  [/\bmodeles?\b/g, (m: string) => m.replace("modele", "modèle")],
  [/\bModeles?\b/g, (m: string) => m.replace("Modele", "Modèle")],
  [/\bmatieres\b/g, "matières"],
  [/\bInconvenient\b/g, "Inconvénient"],
  [/\binconvenient\b/g, "inconvénient"],
  [/\bfrequ?ent\b/g, "fréquent"],
  [/\benvoye\b/g, "envoyé"],
  [/\bentree\b/g, "entrée"],
  [/\bdifferents?\b/g, (m: string) => m.replace("different", "différent")],
  [/\bdifferencies\b/g, "différenciés"],
  [/\bDifficulte\b/g, "Difficulté"],
  [/\bdifficulte\b/g, "difficulté"],
  [/\bCommunaute\b/g, "Communauté"],
  [/\bcommunaute\b/g, "communauté"],
  [/\bArreter\b/g, "Arrêter"],
  [/\barreter\b/g, "arrêter"],
  [/\bl'acces\b/g, "l'accès"],
  [/\bsauvegarde\b(?!r)/g, "sauvegardé"],
  [/\bdernieres\b/g, "dernières"],
  [/\breflexes\b/g, "réflexes"],
  [/\brodees\b/g, "rodées"],
  [/\bsur\b(?=[ .])/g, "sûr"],
  [/\bechoue\b/g, "échoue"],
  [/\bregles?\b/g, (m: string) => m.replace("regle", "règle")],
  [/\bmotdepasse\b/g, "mot de passe"],
  [/\bLancement\b/g, "Lancement"],
];

// Files to skip patterns in (code blocks, URLs, etc.)
const codeBlockRegex = /```[\s\S]*?```/g;
const inlineCodeRegex = /`[^`]+`/g;
const htmlTagRegex = /<[^>]+>/g;

async function fixFile(filePath: string) {
  let content = readFileSync(filePath, "utf-8");
  const original = content;

  const isHtml = filePath.endsWith(".html");
  const isMd = filePath.endsWith(".md");

  // For HTML files, only replace in text content (not in tags/attributes)
  // For MD files, skip code blocks

  let changeCount = 0;

  for (const [pattern, replacement] of replacements) {
    const before = content;
    if (typeof replacement === "string") {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement as any);
    }
    if (content !== before) changeCount++;
  }

  if (content !== original) {
    writeFileSync(filePath, content);
    console.log(`✓ ${filePath} (${changeCount} patterns applied)`);
  } else {
    console.log(`  ${filePath} (no changes)`);
  }
}

const files = [
  "QUICKSTART_CLAUDE_COPILOT.md",
  "MANUEL_CLAUDE_CODE_COPILOT.md",
  "GUIDE_DETAILLE_CLAUDE_COPILOT.md",
  "docs/index.html",
  "docs/claude-code.html",
  "docs/comparaison/index.html",
  "docs/opencode/index.html",
];

console.log("Fixing French accents...\n");
for (const f of files) {
  await fixFile(f);
}
console.log("\nDone!");
