const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'background/index': './src/background/index.ts',
        'content-scripts/main-page/index': './src/content-scripts/main-page/index.ts',
        'content-scripts/item-page/index': './src/content-scripts/item-page/index.ts',
        'content-scripts/profile-page/index': './src/content-scripts/profile-page/index.ts',
        'popup/index': './src/popup/index.tsx'
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
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html'
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: "public",
                    to: ".",
                    globOptions: {
                        ignore: ['**/index.html']
                    }
                }
            ]
        })
    ]
};