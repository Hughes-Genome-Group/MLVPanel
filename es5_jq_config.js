const path = require('path');
webpack=require("webpack");

module.exports = {
  entry: './src/indexes/es5_jq_index.js',
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: 'MLVPanelJQ.js',
publicPath:'../dist/'
  },
  plugins: [
  new webpack.ProvidePlugin({
	Zlib:path.resolve(__dirname,"src/vendor/zlib_and_gzip.min.js"),
	$: "jquery",
	jQuery: "jquery"
     // "window.jQuery": "../../test/node_modules/jquery",
     // "window.$": "../../test/node_modules/jquery"

  })
],


  module:{
      
     rules:[
      {
        test : /\.js/,
	
        include : path.resolve(__dirname, 'src'),
        exclude: path.resolve(__dirname,'src/vendor'),
        loader : 'babel-loader',
 		query: {
                    presets: ['es2015']
                 }
      },
 {
        test: /\.css$/,
        loaders: ["style-loader","css-loader"]
      },
      {
        test: /\.(jpe?g|png|gif)$/i,
        loader:"file-loader",
        options:{
          name:'[name].[ext]',
          outputPath:'assets/images/'
          //the images will be emited to dist/assets/images/ folder
        }
      }
    ]
  }
};
