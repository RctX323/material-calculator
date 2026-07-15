// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Reanimated/Worklets must be the last resolver config
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
