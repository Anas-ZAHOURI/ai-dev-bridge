import { readFileSync, writeFileSync } from "fs";

const replacements: [string | RegExp, string][] = [
  // Faux positifs du round 1 déjà corrigés (sur/sûr)

  // "etes" → "êtes"
  ["Vous etes", "Vous êtes"],
  ["vous etes", "vous êtes"],
  ["Si vous etes", "Si vous êtes"],

  // "installe" (adjectif/participe passé, pas verbe)
  ["pas installe", "pas installé"],
  ["est installe", "est installé"],
  ["Node.js installe", "Node.js installé"],
  [") installe", ") installé"],
  ["Go installe", "Go installé"],
  ["Code installe", "Code installé"],

  // "utilise" (participe passé, pas verbe)
  ["entreprise utilise", "entreprise utilisé"],
  ["est utilise", "est utilisé"],

  // "impose" (adjectif)
  ["Abonnement impose", "Abonnement imposé"],
  ["impose un outil", "impose un outil"], // verbe, OK

  // "limite" (adjectif)
  ["outil limite", "outil limité"],
  ["quota limite", "quota limité"],

  // "presente"
  ["déjà presente", "déjà présente"],

  // "separee"
  ["separee", "séparée"],

  // "a" → "à" (préposition)
  ["appris a etre", "appris à être"],
  ["a etre", "à être"],
  ["a la volee", "à la volée"],
  ["correspond a ", "correspond à "],
  ["aide a ", "aide à "],
  ["d'autre a ", "d'autre à "],

  // Mots manquants
  ["hesitez", "hésitez"],
  ["scenarios", "scénarios"],
  ["Scenarios", "Scénarios"],
  ["Decision", "Décision"],
  ["decision", "décision"],
  ["Donnees", "Données"],
  ["donnee", "donnée"],
  ["donnees", "données"],
  ["extremement", "extrêmement"],
  ["systeme", "système"],
  ["independamment", "indépendamment"],
  ["repartition", "répartition"],
  ["taches", "tâches"],
  ["detecte", "détecté"],
  ["serre", "serré"],
  ["requete", "requête"],
  ["qualite", "qualité"],
  ["illimite", "illimité"],
  ["verrouille", "verrouillé"],
  ["cout", "coût"],
  ["meme ", "même "],
  ["roles", "rôles"],

  // "autorise" quand c'est un participe passé (après "qui")
  ["qui autorisé", "qui autorise"],  // fix faux positif du round 1
  ["qui autorise uniquement", "qui autorise uniquement"],

  // Corrections spécifiques
  ["Vous etes sur un PC", "Vous êtes sur un PC"],
];

const files = [
  "QUICKSTART_CLAUDE_COPILOT.md",
  "MANUEL_CLAUDE_CODE_COPILOT.md",
  "GUIDE_DETAILLE_CLAUDE_COPILOT.md",
  "docs/index.html",
  "docs/claude-code.html",
  "docs/comparaison/index.html",
  "docs/opencode/index.html",
];

console.log("Fixing remaining accents (round 2)...\n");

for (const f of files) {
  let content = readFileSync(f, "utf-8");
  const original = content;
  let count = 0;

  for (const [from, to] of replacements) {
    if (typeof from === "string") {
      while (content.includes(from)) {
        content = content.replace(from, to);
        count++;
      }
    } else {
      const before = content;
      content = content.replace(from, to);
      if (content !== before) count++;
    }
  }

  if (content !== original) {
    writeFileSync(f, content);
    console.log(`✓ ${f} (${count} fixes)`);
  } else {
    console.log(`  ${f} (no changes)`);
  }
}

console.log("\nDone!");
