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
			//The following can be removed if you already have imported jquery
			$: "jquery",
			jQuery: "jquery"
  		})
	],

	module:{
      	rules:[
			//This can be removed if you don't want to support older browsers
      		{
        			test : /\.js/,
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
					//the location in the dist folder
          				outputPath:'images',
					//the location where the css will look for images
					publicPath:'images'
					
                 	}
			}
    		]
  	}
};
