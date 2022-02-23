const path = require('path');

module.exports = {
    entry: './src/index.ts',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins:[

    ],
    resolve: {
        extensions: ['.js', '.ts' ],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'api.bundle.js'
    }
};
