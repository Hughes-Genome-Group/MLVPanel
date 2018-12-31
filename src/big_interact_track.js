import {MLVTrack,MLVBedTrack} from "./tracks.js";
import {BigBedFeatureSource} from "./feature.js";

let decode_function= function(tokens,feature){
	console.log(tokens);
	feature.sourceStart=parseInt(tokens[6]);
	feature.sourceEnd=parseInt(tokens[7]);



};


class BigInteractTrack extends MLVBedTrack{
    constructor(config){
    	config.format="feature";
    	config.featureHeight=30;
		super(config);
		this.feature_store=[];
	}

	_setFeatureSource(){
		this.feature_source = new BigBedFeatureSource(this.config,decode_function);	
	}

	getFeatureAt(gl, chr, coord, bpPerPixel){
		let tolerance = 3*bpPerPixel
		if (coord.y<this.bottom && coord.y>this.bottom-5){
			for (let f of this.feature_store){
				if (gl>f.sourceStart-tolerance && gl<f.sourceEnd+tolerance){
					console.log("sddddddd");
					$("body").css("cursor","pointer");
					return;
				}
			}
		}
		else if (coord.y>this.top && coord.y<this.top+7){
			for (let f of this.feature_store){
				let middle =f.start+(f.end-f.start)/2;
				if (gl>middle-tolerance && gl<middle+tolerance){
					console.log("poooo[]");
				    $("body").css("cursor","pointer");
					return;
				}
			}
		}

		 $("body").css("cursor","default");



	}

	drawFeatures(options){
		this.feature_store=[];
		this.fudge= this.config.featureHeight/3;
		return super.drawFeatures(options)

	}


	renderFeature(feature, coord,ctx,info){
		let q = coord.pw/4;
		this.feature_store.push(feature)
		ctx.moveTo(coord.px,coord.py+coord.h);
		ctx.bezierCurveTo(coord.px+q,coord.py-this.fudge,coord.px1-q,coord.py-this.fudge,coord.px1,coord.py+coord.h);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(coord.px+coord.pw/2,coord.py,3,0, 2 * Math.PI, false);
		ctx.stroke();
	}
}

MLVTrack.custom_tracks["big_interact"]=BigInteractTrack;

export {BigInteractTrack}; 

