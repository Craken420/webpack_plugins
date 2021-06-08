const path = require('path');

const HtmlWebpack = require('html-webpack-plugin');
const MiniCssExtract =
    require('mini-css-extract-plugin'); // extraer css en su propio archivo

const env = process.env.NODE_ENV;

const webpackConfig = {
    entry: './src/index.js',
    mode: env == 'production' || env == 'none' ? env : 'development',
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
                use: [MiniCssExtract.loader, 'css-loader']
            },
            {
                test: /\.scss$/i,
                exclude: /node_modules/,
                use: [MiniCssExtract.loader, 'css-loader', 'sass-loader']
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
    },
    plugins: [
        new HtmlWebpack({
            filename: 'index.html',
            template: 'src/index.html'
        }),
        new MiniCssExtract({
            filename: '[name].css',
            chunkFilename: '[id].css'
        })
    ]
};

module.exports = webpackConfig;
