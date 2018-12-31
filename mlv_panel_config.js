const path = require('path');
webpack=require("webpack");

module.exports = {
	entry: './src/indexes/mlv_panel_index.js',

  	output: {
    		path: path.resolve(__dirname,"dist"),
    		filename: 'mlv_panel.js',
  	},

  	plugins: [
  		new webpack.ProvidePlugin({
			Zlib:path.resolve(__dirname,"src/vendor/zlib_and_gzip.min.js"),
			$: "jquery",
			jQuery: "jquery"
  		})
	],

	module:{
      	rules:[
      		{
        			test : /\.js/,
	        		exclude: path.resolve(__dirname,'src/vendor/zlib_and_gzip.min.js'),
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
        			test: /\.(png|svg|jpg|gif|eot|ttf|woff|woff2)$/,
        			loader:"file-loader",
        			options:{
          				name:'[name].[ext]',
          				outputPath:'images/'
                 	}
			}
    		]
  	}
};
