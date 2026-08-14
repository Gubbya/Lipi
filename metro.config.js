const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite uses wa-sqlite on web. Metro must emit its WebAssembly binary
// as a bundled asset instead of attempting to resolve it as source code.
config.resolver.assetExts.push('wasm');

module.exports = config;
