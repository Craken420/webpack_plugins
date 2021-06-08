const path = require('path');

const HtmlWebpack = require('html-webpack-plugin');
const MiniCssExtract =
    require('mini-css-extract-plugin'); // extraer css en su propio archivo

const TerserPlugin = require('terser-webpack-plugin'); // minimizar el JS generado
    // versiones anteriores: uglifyjs-webpack-plugin
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin'); // minimizar el CSS generado
    // versiones anteriores: optimize-css-assets-webpack-plugin

const env = process.env.NODE_ENV;

const webpackConfig = {
    entry: './src/index.js',
    mode: env == 'production' || env == 'none' ? env : 'development',
    output: {
        path: path.resolve(__dirname + '/dist'),
        filename: env == 'production' ? 'bundle.min.js' : 'bundle.js',
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
            template: 'src/index.html',

        }),
        new MiniCssExtract({
            filename: '[name].css',
            chunkFilename: '[id].css'
        })
    ],
    optimization: {
        minimizer: []
    }
};

const sendOptimization = function (plugins) {
    plugins.forEach( function(plugin) {
        webpackConfig.optimization.minimizer.push(plugin)
    })
}

// Load this plugin only when running webpack in a production environment
if (env == 'production') {
    sendOptimization([
        new TerserPlugin(),
        new CssMinimizerPlugin({
            exclude: /node_modules/,
            // minify: CssMinimizerPlugin.cleanCssMinify, // Limpiar
            // minify: CssMinimizerPlugin.cssoMinify, // Tipo de minificación
            // minify: CssMinimizerPlugin.cssnano // // Tipo de minificación default
            minify: async (data, inputMap) => {
                const csso = require('csso');
                const sourcemap = require('source-map');
                const [[filename, input]] = Object.entries(data);

                const minifiedCss = csso.minify(input, {
                    filename: filename,
                    sourceMap: true,
                });
                if (inputMap) {
                    minifiedCss.map.applySourceMap(
                        new sourcemap.SourceMapConsumer(inputMap),
                        filename
                    );
                }
                // console.log({
                //     code: minifiedCss.css,
                //     map: minifiedCss.map.toJSON(),
                // })
                return {
                    code: minifiedCss.css,
                    map: minifiedCss.map.toJSON(),
                };
            },
            minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true }, // Eliminar comentarios
                  },
                ],
            },
        })
    ])
}

module.exports = webpackConfig;
