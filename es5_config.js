const path = require('path');
webpack=require("webpack");

module.exports = {
  entry: './src/indexes/es5_index.js',
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: 'MLVPanel.js'
  },
  plugins: [
  new webpack.ProvidePlugin({
	Zlib:path.resolve(__dirname,"src/vendor/zlib_and_gzip.min.js")

  })
],


  module:{
      
     rules:[
      {
        test : /\.js/,
	exclude: [path.resolve(__dirname, 'src/vendor'),path.resolve(__dirname, 'src/indexes')],
        include : path.resolve(__dirname, 'src//'),
        loader : 'babel-loader',
 		query: {
                     presets: ['es2015']
                 }
      }
    ]
  }
};
