const esbuild = require("esbuild");
const pinoPlugin = require("esbuild-plugin-pino");

try {
  esbuild.build({
    entryPoints: ["./src/index.ts"],
    bundle: true,
    minify: false,
    platform: "node",
    format: "esm",
    target: "node20",
    outdir: "./dist",
    outExtension: { ".js": ".mjs" }, // Génère exactement le fichier .mjs requis par ton script start
    sourcemap: true,
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
    },
    plugins: [pinoPlugin({ transports: ["pino-pretty"] })],
    external: [
      "express",
      "@google-cloud/storage",
      "pg",
      "stripe",
      "@clerk/express"
    ],
  }).then(() => {
    console.log("⚡ Build backend réussi avec esbuild !");
  }).catch((error) => {
    console.error("Échec du build backend:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("Erreur d'initialisation du build:", error);
  process.exit(1);
}
