const path = require('path');

module.exports = {
  mode: 'production',
  target: 'electron-main',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};