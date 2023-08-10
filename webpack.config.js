const path = require('path');
const nodeExternals = require('webpack-node-externals');


module.exports = {
  entry: './background.js', // assuming your original background.js is in src directory
  output: {
    filename: 'background.bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  externals: [nodeExternals()]

};
