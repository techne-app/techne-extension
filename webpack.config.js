const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');
const featureFlags = require('./feature-flags.json');

// Dynamically modify manifest.json based on feature flags
function modifyManifest() {
  const manifestPath = path.resolve(__dirname, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  if (!featureFlags.personalize) {
    delete manifest.content_security_policy;
  }

  const modifiedManifestPath = path.resolve(__dirname, 'dist/manifest.json');
  fs.writeFileSync(modifiedManifestPath, JSON.stringify(manifest, null, 2));
}

module.exports = {
  entry: {
    'popup/index': './src/popup/index.tsx',
    'background/index': './src/background/index.ts',
    'content-scripts/main-page/index': './src/content-scripts/main-page/index.ts',
    'content-scripts/item-page/index': './src/content-scripts/item-page/index.ts',
    'content-scripts/profile-page/index': './src/content-scripts/profile-page/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
        { from: 'images', to: 'images', noErrorOnMissing: true },
      ],
    }),
    {
      apply: (compiler) => {
        compiler.hooks.done.tap('ModifyManifestPlugin', modifyManifest);
      },
    },
  ],
};