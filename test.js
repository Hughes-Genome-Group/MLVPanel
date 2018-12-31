import {MLVImageGen} from "./src/node/image_gen.js";


let tracks= [{type:"ruler"},{url:"https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg19/genes/refGene.hg19.bed.gz"},
{url:"http://userweb.molbiol.ox.ac.uk/public/lanceotron/hmocbVPzOROlaVRzBQJBtuDGS/100.bw",color:"red"}];
let a = new MLVImageGen(tracks,{
	locations:[
		["chr16",100000,500000,"c:\\dev\\MLVPanel\\test1.png"],
		["chr16",500000,1000000,"c:\\dev\\MLVPanel\\test2.png"],
		["chr16",1000000,1500000,"c:\\dev\\MLVPanel\\test3.png"]
	]
});
a.drawImages();

let b = new MLVImageGen(tracks,{
	locations:[
		["chr16",100000,500000,"c:\\dev\\MLVPanel\\test4.png"],
		["chr16",500000,1000000,"c:\\dev\\MLVPanel\\test5.png"],
		["chr16",1000000,1500000,"c:\\dev\\MLVPanel\\test6.png"]
	]
});
b.drawImages();






