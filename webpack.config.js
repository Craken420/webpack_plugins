const path = require('path');

const webpackConfig = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname + '/dist'),
        filename: 'bundle.js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.js$/i,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/i,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.scss$/i,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader', 'sass-loader']
            },
            {
                test: /\.(jpe?g|png|gif)$/i,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10 * 1024, // Images larger than 10 KB won’t be inlined
                        filename: 'images/[hash]-[name].[ext]',
                        publicPath: 'assets'
                    }
                }]
            },
            {
                test: /\.svg$/i,
                use:[{
                    loader: 'svg-url-loader',
                    options: {
                        limit: 10 * 1024, // Images larger than 10 KB won’t be inlined
                        // Remove quotes around the encoded URL –
                        // they’re rarely useful
                        noquotes: true
                    }
                }]
            }
        ]
    }
};

module.exports = webpackConfig;
