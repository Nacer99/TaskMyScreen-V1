const esbuild = require("esbuild");
const pinoPlugin = require("esbuild-plugin-pino");
// Correction de l'import pour le format CommonJS (.cjs)
const tsconfigPaths = require("esbuild-plugin-tsconfig-paths").default;

try {
  esbuild.build({
    entryPoints: ["./public/apps/api-server/src/index.ts"],
    bundle: true,
    minify: false,
    platform: "node",
    format: "esm",
    target: "node20",
    outdir: "./public/apps/api-server/dist", 
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    plugins: [
      tsconfigPaths(), // Va maintenant correctement lire ton tsconfig.json racine
      pinoPlugin({ transports: ["pino-pretty"] })
    ],
    // On garde externes les modules natifs ou complexes pour éviter des conflits dans le bundle
    external: ["express", "@google-cloud/storage", "pg", "stripe", "@clerk/express"],
  }).then(() => {
    console.log("⚡ [SUCCESS] Build backend de l'API compilé avec succès !");
  }).catch((error) => {
    console.error("❌ [ERROR] Échec du build esbuild :", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Erreur critique d'initialisation :", error);
  process.exit(1);
}
