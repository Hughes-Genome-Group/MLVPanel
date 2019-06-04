const fs = require("fs");
import {MLVTrack} from "../tracks.js";
const Canvas = require("canvas");
const path = require("path")

class MLVImageGen {
   constructor (tracks,config) {
           this.show_scale=true;
		if (!config){
			this.config =config={};
		}
		else{
			this.config=config;
		}
		this.config.height=this.config.height?this.config.height:200;
		this.config.width=this.config.width?this.config.width:300;
		if (!this.config.type){
			this.config.type="png";
		}
		this.c_type="png";
		this.stream="createPNGStream";
		if (config.type==="svg"){ 
			this.c_type="svg";

		}
           if (config.type==="pdf"){
			this.stream="createPDFStream";
			this.c_type="pdf";
		}
		this.fixed_height_mode=false;
		if (config.fixed_height_mode){
			this.fixed_height_mode=true;
		}
        	
            
           
		

           
		this.tracks={};
		this.track_order=[];
		for (let t_config of tracks){
			let track=MLVTrack.getTrack(t_config);
			this.tracks[track.config.track_id]=track;
			this.track_order.push(track.config.track_id);
		}
		for (let t_id of this.track_order){
    			let track = this.tracks[t_id];
    			//if this track is linked to the scale of another
    			//get pointer to the track
    			let link_to = track.config['scale_link_to'];
    			if (link_to){
				let other_track = this.tracks[link_to];
				if (other_track){
					track.scale_link_to=other_track;
				}
    			}
    		}
  
       	this.index=0;
    }

	getTracksHeight(){
    		let h =3;
    		for (let t in this.tracks){
			h+=this.tracks[t].config.height+3;
    		}
    		return h;
	}	



    drawImages(){
		let loc = this.config.images;
		if (this.index<loc.length){
			let info=loc[this.index];
			let h_region=null;
			if (info.highlight){
				h_region={
					chr:info.loc[0],
					start:info.highlight[1],
					end:info.highlight[2],
					color:info.highloght[3]?info.highlight[3]:"blue"
				}
			}
			let stub = info.stub;
			if (!stub){
				stub=info.loc[0]+"_"+info.loc[1]+"_"+info.loc[2];
			}
			let file = path.resolve(this.config.folder,stub+"."+this.config.type);	
			this.drawImage(info.loc[0],info.loc[1],info.loc[2],file,h_region);
				
		}
    	}

   
    
	drawImage(chr,start,end,file,region){
		console.log(file);
        	let bpPerPixel=(end-start)/this.config.width;
	   	let self = this;
		let height = this.fixed_height_mode?this.getTracksHeight():this.config.height;
		this.canvas=Canvas.createCanvas(this.config.width,height,this.c_type);
		this.ctx = this.canvas.getContext('2d');
        	this.getAllFeatures(chr, start, end,{pixelWidth:this.config.width,bpPerPixel:bpPerPixel})
                .then(function (all_features) {
                    if (all_features) {             
                        var options ={
                             context: self.ctx,
                             bpStart: start,
                             bpPerPixel: bpPerPixel,
                             pixelWidth:self.config.width,
                             pixelHeight: height,
                        };
                        let top=3;
                        self.groups={};
				
				  self.ctx.clearRect(0, 0, self.config.width, self.config.height)
                        for (let i in all_features){
                        	let track = self.tracks[self.track_order[i]];
                        	options.features=all_features[i];
                        	let group = track.config.group
                        	if (group){
                        		if (!self.groups[group]){
                        			self.groups[group]={top:top,height:track.config.height,label_offset:15}
							top+=track.config.height;
                        		}
						else{
							self.groups[group].label_offset+=15;
						}
                        		options.top=self.groups[group].top;
                        		options.height=self.groups[group].height;

                        	}
                        	else{
                        		options.top =top
                        	}
					let disc = self.fixed_height_mode || track.config.discrete || group;
					if (disc){
						self.ctx.save();
						self.ctx.rect(0,options.top,options.pixelWidth,track.config.height);
						self.ctx.clip();
						self.ctx.beginPath();

					}
                           let offset=track.drawFeatures(options);
					if (track.config.type !== "ruler"){
						self.ctx.fillStyle = "black";
						self.ctx.font="10px Arial";
						let t_w= self.ctx.measureText(track.config.short_label).width+5;
						let l_offset=15;
						if (group){
							l_offset=self.groups[group].label_offset;
						}
						self.ctx.fillText(track.config.short_label,self.config.width-t_w,options.top+l_offset,);
					}
					if (disc){
						self.ctx.restore();
						if (!group){
							top+=track.config.height+3;
						}
					}
                         	else if (offset){
                         	  	top=offset+3;
                           }
                           if (self.show_scale){
						self.ctx.font="10px Arial";
                            	track.drawScale(options.pixelHeight,self.ctx)
                           }
                                      
                        }
                        if (region){
					let start= (region.start-options.bpStart)/options.bpPerPixel;
    					start = start<0?0:start;
					let width = (region.end-region.start)/options.bpPerPixel;
    					width =width>options.pixelWidth?options.pixelWidth:width;
					self.ctx.globalAlpha=0.1;
					self.ctx.fillStyle=region.color;
    					self.ctx.fillRect(start,0,width,options.pixelHeight);
    					self.ctx.globalAlpha=1.0;
                        }
                        
                    
                    }
		                
				
				if (self.config.type==="svg"){
					fs.writeFileSync(file, self.canvas.toBuffer())
					
				}
				else{
					const out = fs.createWriteStream(file);
					const stream = self.canvas[self.stream]();
					stream.pipe(out);
					
				}
			
				

				self.index++;
				self.drawImages();
                })
                .catch(function (error) {
                    console.log(error.toString());
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