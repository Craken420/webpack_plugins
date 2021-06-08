const path = require('path');

const webpackConfig = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname + '/dist'),
        filename: 'bundle.js',
        clean: true
    }
};

module.exports = webpackConfig;
