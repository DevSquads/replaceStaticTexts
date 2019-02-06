module.exports = {
  entry: ['./src/app.js'],
  output: {
    filename: 'bundle.js',
  },
  node: {
    fs: 'empty',
  },
  module: {
    rules: [{
      test: /\.js$/, // include .js files
      enforce: 'pre', // preload the jshint loader
      exclude: /node_modules/, // exclude any and all files in the node_modules folder
      loader: 'eslint-loader',
      options: {
        // eslint options (if necessary)
      },
    }],
  },
  devServer: {
    port: 5050,
  },
};
