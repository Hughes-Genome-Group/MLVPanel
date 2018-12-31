const path = require('path');
webpack=require("webpack");
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './test.js',
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: 'test.js'

  },
	  plugins: [
  new webpack.ProvidePlugin({
	Zlib:path.resolve(__dirname,"src/vendor/zlib_and_gzip.min.js"),
      "$.extend":"extend",
      XMLHttpRequest:"xhr2",
       $:"jquery"
  })
],

  module:{
      
     rules:[
      {
        test : /\.js/,
	exclude: [path.resolve(__dirname, 'src/vendor/zlib_and_gzip.min.js')],
        loader : 'babel-loader',
 		query: {
                     presets: ['es2015']
                 }
      }
    ]
  },
   target:'node',
externals: [nodeExternals()]

};
