const path = require('path')
const {CheckerPlugin} = require('awesome-typescript-loader')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    entry: path.join(__dirname, 'src', 'ts', 'roam-vim-plugin', 'index.tsx'),
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'roam-vim-plugin.js',
        library: 'RoamToolkitVimPlugin',
        libraryTarget: 'window',
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx', '.json'],
        alias: {
            src: path.resolve(__dirname, 'src/ts/'),
        },
    },
    module: {
        rules: [{test: /\.(js|ts|tsx)?$/, loader: 'awesome-typescript-loader', exclude: /node_modules/}],
    },
    optimization: {
        minimize: false,
    },
    plugins: [
        new CheckerPlugin(),
        new CopyWebpackPlugin([
            {
                from: path.join(__dirname, 'src', 'ts', 'roam-vim-plugin', 'extension.js'),
                to: path.join(__dirname, 'dist', 'extension.js'),
                toType: 'file',
            },
        ]),
    ],
}
