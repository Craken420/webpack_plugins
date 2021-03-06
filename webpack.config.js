const path = require('path');
const glob = require('glob');

const HelloWorld = require('./src/js/plugins/HelloWorld');
const CustomManifestPlugin = require('./src/js/plugins/WebpackCustomManifestPlugin');
    
const HtmlWebpack = require('html-webpack-plugin');
const MiniCssExtract =
    require('mini-css-extract-plugin'); // extraer css en su propio archivo

const TerserPlugin = require('terser-webpack-plugin'); // minimizar el JS generado
    // versiones anteriores: uglifyjs-webpack-plugin
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin'); // minimizar el CSS generado
    // versiones anteriores: optimize-css-assets-webpack-plugin

const ImageminPlugin = require('imagemin-webpack-plugin').default // minizar imagenes

const PurgeCssPlugin = require('purgecss-webpack-plugin');

const CopyPlugin = require('copy-webpack-plugin');

    // elimina selectores CSS no utilizados de los archivos CSS.
const env = process.env.NODE_ENV;
const utilities = 'assets/js/utilities/[name]-[contenthash]';
const envFileName = env == 'production' ? utilities + '.min.js' :  utilities + '.js'
const webpackConfig = {
    entry: {
        app: ['@babel/polyfill', './src/js/index.js', './src/css/style.css'],
        random: {
            import: ['@babel/polyfill/noConflict', './src/js/utilities/random.js'],
            filename: envFileName
        },
        copyToClipboard: {
            import: ['@babel/polyfill/noConflict', './src/js/utilities/copyToClipboard.js'],
            filename: envFileName
        },
        print: {
            import: ['@babel/polyfill/noConflict', './src/js/utilities/print.js'],
            filename: envFileName
        }
    },
    mode: env == 'production' || env == 'none' ? env : 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        // filename: env == 'production' ? 'assets/js/[name]-[contenthash].min.js' : 'assets/js/[name]-[contenthash].js',
        filename: 'assets/js/[name]-[contenthash].js',
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
                        limit: 10 * 1024, // Images larger than 10 KB won???t be inlined
                        name: '[name]-[hash].[ext]',
                        outputPath: 'assets/images',
                        publicPath: this.outputPath
                    }
                }]
            },
            {
                test: /\.svg$/i,
                use:[{
                    loader: 'svg-url-loader',
                    options: {
                        limit: 10 * 1024, // Images larger than 10 KB won???t be inlined
                        // Remove quotes around the encoded URL ???
                        // they???re rarely useful
                        noquotes: true,
                        name: '[name]-[hash].[ext]',
                        outputPath: 'assets/images',
                        publicPath: this.outputPath
                    }
                }]
            }
        ]
    },
    plugins: [
        new HtmlWebpack({
            filename: 'index.html',
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
            filename: env == 'production'
                ? 'assets/css/[name]-[contenthash].min.css'
                : 'assets/css/[name]-[contenthash].css'
        }),
        new ImageminPlugin({
            pngquant: {
                quality: [0.3, 0.5] // usar la menor cantidad de colores necesarios
                    // para alcanzar o superar la calidad m??xima
            },
            test: /\.(jpe?g|png|gif|svg)$/i,
 	        disable: env == 'production'
        }),
        new HelloWorld({
            message: 'Badge "webpack bundler bender" unlocked!'
        }),
        new CustomManifestPlugin({
            outputPath: path.resolve(__dirname + '/')
        }),
        new CopyPlugin({
            patterns: [
                { from: 'src/js/vendors/jquery.min.js', to: 'assets/js/vendors/jquery.min.js' },
            ]
        }),
    ],
    optimization: {
        minimizer: []
    }
}

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
            // minify: CssMinimizerPlugin.cssoMinify, // Tipo de minificaci??n
            // minify: CssMinimizerPlugin.cssnano // // Tipo de minificaci??n default
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
