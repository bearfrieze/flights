var BrowserSyncPlugin = require('browser-sync-webpack-plugin')

module.exports = {
  entry: "./main.es6",
  output: {
      filename: "main.js"
  },
  module: {
    loaders: [
      {
        test: /\.es6?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      }
    ]
  },
  plugins: [
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 8080,
      server: { baseDir: ['.'] }
    })
  ]
}
