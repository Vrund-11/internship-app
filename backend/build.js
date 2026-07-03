const esbuild = require("esbuild");
const packageJson = require("./package.json");

// Mark third-party packages as external so they are loaded from node_modules on Render
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  // Always mark native/built-in modules or prisma client generated packages as external
  "@prisma/client",
];

esbuild.build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/server.js",
  external: external,
}).then(() => {
  console.log("⚡ Backend bundled successfully using esbuild!");
}).catch(() => process.exit(1));
