const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, '../../dist/client'),
        },
        hot: true,
    },
    plugins: [
        new CopyPlugin({
          patterns: [
            { from: path.join(__dirname, './skull'), to: path.join(__dirname, '../../dist/client/skull') },
          ],
        }),
      ],
})
