const path = require('path');
const fs = require('fs');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  resolve: {
    alias: {
      "@huggingface/transformers": path.resolve(
        __dirname,
        "node_modules/@huggingface/transformers",
      ),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
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
    chunkLoading: false,
  },
  optimization: {
    splitChunks: false,
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
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '.' },
        { from: 'images', to: 'images', noErrorOnMissing: true },
      ],
    }),
  ],
};