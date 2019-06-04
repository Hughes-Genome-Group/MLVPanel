import {MLVImageGen} from "../node/image_gen.js";

var file= process.argv[2];
var fs = require("fs");
var contents = fs.readFileSync(file);
var json = JSON.parse(contents);

if (!json.config.folder){
	json.config.folder="images";
}

if (!fs.existsSync(json.config.folder)){
    fs.mkdirSync(json.config.folder);
}

let ig = new MLVImageGen(json.tracks,json.config);
ig.drawImages();