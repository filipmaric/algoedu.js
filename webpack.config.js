const path = require('path');

module.exports = {
    mode: 'development',
    entry: {
        Graph: './components/graph.js',
        Arrays: './components/array.js',
        Interpreter: './components/interpreter.js'
    },
    output: {
        filename: '[name].js',
        library: {
            name: '[name]',
            type: 'umd',
        },
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/, // Match CSS files
                use: ['style-loader', 'css-loader'], // Use the loaders
            },
        ],
    },    
};
