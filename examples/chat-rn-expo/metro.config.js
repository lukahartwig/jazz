// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { FileStore } = require("metro-cache");
const path = require("path");

// eslint-disable-next-line no-undef
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot, { isCSSEnabled: true });

// Since we are using pnpm, we have to setup the monorepo manually for Metro
// #1 - Watch all files in the monorepo
config.watchFolders = [workspaceRoot];
// #2 - Try resolving with project modules first, then workspace modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.sourceExts = ["mjs", "js", "json", "ts", "tsx"];
// even though this is true by default, it seems to help zod
// TODO: revisit if we find a smoking gun, and remove if we can
config.resolver.unstable_enablePackageExports = true;

config.resolver.requireCycleIgnorePatterns = [
  /(^|\/|\\)node_modules($|\/|\\)/,
  /(^|\/|\\)packages($|\/|\\)/,
];

// --- START: Added/Modified section to transpile Zod ---
// Ensure Zod is transformed by Babel along with other necessary React Native packages.
// The pattern below is a common one, with 'zod' added to the list of packages
// that SHOULD be transformed (i.e., not ignored by the transformer).
config.transformer = {
  ...config.transformer, // Preserve existing transformer settings if any from getDefaultConfig
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true, // Recommended for React Native for performance
    },
  }),
  // This pattern tells Metro to transform Zod and other common RN/Expo packages.
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|@react-native-community|expo|@expo|zod)/)",
  ],
};
// --- END: Added/Modified section to transpile Zod ---

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({
    root: path.join(projectRoot, "node_modules", ".cache", "metro"),
  }),
];

module.exports = withNativeWind(config, { input: "./global.css" });
