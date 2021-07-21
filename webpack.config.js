const path = require('path');
const nodeExternals = require('webpack-node-externals');
const MODE = process.env.NODE_ENV;

module.exports = {
  mode: MODE,
  entry: {
    app: './src/app.ts'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts']
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  target: 'node',
  externals: [nodeExternals()],
}