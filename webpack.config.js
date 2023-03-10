const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        Graph: './components/graph.js',
    },
    output: {
        filename: '[name].js',
        library: {
            name: '[name]',
            type: 'umd',
        },
        path: path.resolve(__dirname, 'dist'),
    },
};
