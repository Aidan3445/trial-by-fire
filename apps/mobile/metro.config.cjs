/* eslint-disable no-undef */
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for changes in shared packages
config.watchFolders = [monorepoRoot];

// Resolve modules from both the project and monorepo root node_modules
// Local node_modules is listed first so mobile-specific versions take priority
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure React Native packages resolve from the mobile app's local node_modules
// to avoid hoisting conflicts with the web app's incompatible versions
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-svg': path.resolve(projectRoot, 'node_modules/react-native-svg'),
};

module.exports = withNativeWind(config, { input: './src/global.css' });
