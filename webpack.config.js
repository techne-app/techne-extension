const path = require('path');

module.exports = {
 entry: {
   'main_page_content': './techne-extension Extension/Resources/src/main_page_content.ts',
   'item_page_content': './techne-extension Extension/Resources/src/item_page_content.ts'
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
 mode: 'production',
 devtool: 'cheap-module-source-map'

};