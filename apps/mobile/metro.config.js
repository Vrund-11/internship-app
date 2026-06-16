/**
 * Metro config for monorepo support.
 *
 * By default, Metro only bundles files within the project root (apps/mobile).
 * We need to tell it about our workspace packages so it can resolve
 * @canovet/core and @canovet/shared imports.
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Tell Metro where to resolve packages from
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
