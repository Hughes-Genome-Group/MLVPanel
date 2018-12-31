const fs = require("fs");
import {MLVTrack,RulerTrack} from "../tracks.js";
import Canvas from "canvas";

class MLVImageGen {
   constructor (tracks,config) {
		if (!config){
			this.config =config={};
		}
		else{
			this.config=config;
		}
		this.config.height=this.config.height?this.config.height:200;
		this.config.width=this.config.width?this.config.width:300;
		console.log(this.config.width)
        	this.canvas=Canvas.createCanvas(300,200,"");
           this.ctx = this.canvas.getContext('2d');         
           console.log("ddddddddddd");
		this.tracks={};
		this.track_order=[];
		for (let t_config of tracks){
			let track=MLVTrack.getTrack(t_config);
			this.tracks[track.config.track_id]=track;
			this.track_order.push(track.config.track_id);
		}
  
       	this.index=0;
    }



    drawImages(){
		console.log(this.index);
		let loc = this.config.locations
		if (this.index<loc.length){
			let info=loc[this.index]
			this.drawImage(info[0],info[1],info[2],info[3]);
		}

    }

   
    
	
    drawImage(chr,start,end,file) {
        console.log(file);
        let bpPerPixel=(end-start)/this.config.width;
	   let self = this;
        this.getAllFeatures(chr, start, end,{pixelWidth:this.config.width,bpPerPixel:bpPerPixel})
                .then(function (all_features) {
                console.log("going to clear canvas");
                    if (all_features) {             
                        var options ={
                             context: self.ctx,
                             bpStart: start,
                             bpPerPixel: bpPerPixel,
                             pixelWidth:self.config.width,
                             pixelHeight: self.config.height,
                        };
                        let top=0;
                        self.groups={};
				
				  self.ctx.clearRect(0, 0, self.config.width, self.config.height)
				  console.log("clear canvas");
                        for (let i in all_features){
                        	let track = self.tracks[self.track_order[i]];
                        	options.features=all_features[i];
                        	let group = track.config.group
                        	if (group){
                        		if (!self.groups[group]){
                        			self.groups[group]={top:top,height:track.config.height}
                        		}
                        		options.top=self.groups[group].top;
                        		options.height=self.groups[group].height;

                        	}
                        	else{
                        		options.top =top
                        	}
                            let offset=track.drawFeatures(options);
                         	 if (offset){
                         	  	top=offset;
                            }
                            /*if (self.show_scale){
                            	track.drawScale(options.pixelHeight,self.scale_ctx)
                            }*/
                                      
                        }
                        /*for (let name in self.highlighted_regions){
                        	let region = self.highlighted_regions[name];
                        	if (self.chr !== region.chr){
                        		continue;
                        	}
                        	if (region.end<bpStart ||region.start>bpEnd){
                        		continue
                        	}
                        	self.drawHighlightedRegion(region,options);
                        }*/
                        
                    
                    }
                 console.log("creating stream");
			//const out = fs.createWriteStream(file)
                console.log("drawing "+file);
			//const stream = self.canvas.createPNGStream()
			fs.writeFileSync(file, self.canvas.toBuffer())
			//stream.pipe(out)
			self.index++;
			self.drawImages()

			    

                })
                .catch(function (error) {
                    console.log(error);
			    self.index++;
                    self.drawImages();
                });
     	}

	getAllFeatures(chr,bpStart,bpEnd,data) {
      	let promises = [];
        	for (let track_id  of this.track_order){
        		let track = this.tracks[track_id];
        		promises.push(track.getFeatures(chr,bpStart,bpEnd,false,data));       
        	}

        	return Promise.all(promises);

           
    	}

}

export {MLVImageGen}