const path = require('path');

module.exports = {
  entry: {
    'main_page_content': './techne-extension Extension/Resources/src/main_page_content.ts',
    'item_page_content': './techne-extension Extension/Resources/src/item_page_content.ts',
    'index': './techne-extension Extension/Resources/src/index.tsx',
    'background': './techne-extension Extension/Resources/background.js'
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