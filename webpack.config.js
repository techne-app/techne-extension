const path = require('path');

module.exports = {
  entry: {
    'content-scripts/main-page/index': './techne-extension Extension/Resources/src/content-scripts/main-page/index.ts',
    'content-scripts/item-page/index': './techne-extension Extension/Resources/src/content-scripts/item-page/index.ts',
    'background/index': './techne-extension Extension/Resources/src/background/index.ts',
    'popup/index': './techne-extension Extension/Resources/src/popup/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'techne-extension Extension/Resources'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom')
    }
  },
  mode: 'production',
  devtool: 'cheap-module-source-map'
};