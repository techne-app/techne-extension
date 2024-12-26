const path = require('path');

module.exports = {
  entry: {
    'main_page_content': './src/main_page_content.ts',
    'item_page_content': './src/item_page_content.ts',
    'popup': './src/popup.tsx'
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
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  mode: 'development'
};