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
			"$.extend":"extend",
       		"$.ajax":"najax",
     			 XMLHttpRequest:"xhr2",
       		$:"jquery",
			Image:["Canvas","Image"]
  		})
	],
    	target:'node',
  	externals: [nodeExternals()]
};
