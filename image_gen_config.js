const path = require('path');
webpack=require("webpack");
const nodeExternals = require('webpack-node-externals');

module.exports = {
	entry: './src/indexes/image_gen_index.js',
  	output: {
    		path: path.resolve(__dirname,"dist"),
    		filename: 'image_gen.js'
  	},
	plugins: [
  		new webpack.ProvidePlugin({
			Zlib:path.resolve(__dirname,"src/vendor/zlib_and_gzip.min.js"),
      		"$.extend":"extend",
       		"$.ajax":"najax",
     			 XMLHttpRequest:"xhr2",
       		$:"jquery"
  		})
	],
    	target:'node',
  	externals: [nodeExternals()]
};
