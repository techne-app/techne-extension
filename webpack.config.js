import path from "path";
import { fileURLToPath } from "url";

import CopyPlugin from "copy-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('webpack').Configuration} */
const config = {
  // Mode will be set by CLI argument (--mode=production or --mode=development)
  devtool: process.env.NODE_ENV === 'production' ? false : "inline-source-map",
  entry: {
    'background/index': './src/background/index.ts',
    'popup/index': './src/popup/index.tsx',
    'content-scripts/main-page/index': './src/content-scripts/main-page/index.ts',
    'content-scripts/item-page/index': './src/content-scripts/item-page/index.ts',
    'content-scripts/profile-page/index': './src/content-scripts/profile-page/index.ts',
  },
  resolve: {
    alias: {
      "@huggingface/transformers": path.resolve(
        __dirname,
        "node_modules/@huggingface/transformers",
      ),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",

    // Otherwise we get `Uncaught ReferenceError: document is not defined`
    chunkLoading: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          to: ".", // Copies to dist folder
        }
      ],
    }),
  ],
  module: {
    parser: {
      javascript: {
        importMeta: false,
      },
    },
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
};

export default config;
