const path = require('path');
const glob = require('glob');

const HtmlWebpack = require('html-webpack-plugin');
const MiniCssExtract =
    require('mini-css-extract-plugin'); // extraer css en su propio archivo

const TerserPlugin = require('terser-webpack-plugin'); // minimizar el JS generado
    // versiones anteriores: uglifyjs-webpack-plugin
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin'); // minimizar el CSS generado
    // versiones anteriores: optimize-css-assets-webpack-plugin

const ImageminPlugin = require('imagemin-webpack-plugin').default // minizar imagenes

const PurgeCssPlugin = require('purgecss-webpack-plugin');

    // elimina selectores CSS no utilizados de los archivos CSS.
const env = process.env.NODE_ENV;

const webpackConfig = {
    entry: './src/index.js',
    mode: env == 'production' || env == 'none' ? env : 'development',
    output: {
        path: path.resolve(__dirname + '/dist/assets'),
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
                use: [
                    MiniCssExtract.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader', // procesar CSS con PostCSS.
                        options: {
                            postcssOptions: {
                                plugins: function() {
                                    return [
                                        require('precss'),  // permite usar marcado tipo Sass
                                                            // y funciones CSS por etapas en CSS.
                                        require('autoprefixer') // Complemento PostCSS para analizar CSS
                                            // y agregar prefijos de vendor a las reglas de CSS.
                                    ]; 
                                }
                            }
                        }
                    },
                ]
            },
            {
                test: /\.scss$/i,
                exclude: /node_modules/,
                use: [
                    MiniCssExtract.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader', // procesar CSS con PostCSS.
                        options: {
                            postcssOptions: {
                                plugins: function() {
                                    return [
                                        require('precss'),  // permite usar marcado tipo Sass
                                                            // y funciones CSS por etapas en CSS.
                                        require('autoprefixer') // Complemento PostCSS para analizar CSS
                                            // y agregar prefijos de vendor a las reglas de CSS.
                                    ]; 
                                }
                            }
                        }
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.(jpe?g|png|gif)$/i,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 10 * 1024, // Images larger than 10 KB won’t be inlined
                        name: '[hash].[name].[ext]',
                        outputPath: 'images',
                        publicPath: this.outputPath
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
                        noquotes: true,
                        name: '[hash].[name].[ext]',
                        outputPath: 'images',
                        publicPath: this.outputPath
                    }
                }]
            }
        ]
    },
    plugins: [
        new HtmlWebpack({
            filename: '../index.html',
            template: 'src/index.html',
            minify: env === 'production'
                ? {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true
                }
                : false,
        }),
        new MiniCssExtract({
            filename: env == 'production' ? '[name].min.css' : '[name].css',
            chunkFilename: '[id].css'
        }),
        new ImageminPlugin({
            disable: false, // Deshabilitar en modo dev
            pngquant: {
                quality: [0.3, 0.5] // usar la menor cantidad de colores necesarios
                    // para alcanzar o superar la calidad máxima
            },
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
                    sourceMap: true
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
                    map: minifiedCss.map.toJSON()
                };
            },
            minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true }, // Eliminar comentarios
                  }
                ]
            }
        }),
        new PurgeCssPlugin({
            paths: glob.sync(path.join(__dirname, 'src') + '/**/*', { nodir: true})
        })
    ])
}

module.exports = webpackConfig;
