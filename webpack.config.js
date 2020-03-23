const path = require('path')
module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: 'webpack-bundle.js',
        path: path.join(__dirname, './public')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['babel-loader?cacheDirectory'],
                include: /src/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
                include: /src/
            }
        ]
    }
}