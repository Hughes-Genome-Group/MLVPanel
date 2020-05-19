/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Class representing a lightweight panel the can host multiple tracks of
 * different types
 */
import {MLVTrack,RulerTrack} from "./tracks.js";
import {Utils} from "./utils.js";
import {PanelLegend} from "./panel_legend.js";



class MLVPanel {
	/**
	* Creates a panel
	* @param {array} tracks - a list of config objects describing each track
	* @param {object} config - A config with the panel settings
	*/
	constructor (tracks,config) {
		if (!config){
			config={};
		}
		this.fixed_height_mode=false;
		if (config.fixed_height_mode){
			this.fixed_height_mode=true;
		}


		this.show_scale=true;
		if (config.show_scale){
       		this.show_scale=true;
       	}

		let height=config.height?config.height:200;
		let width= config.width?config.width:400;
		let dim={height:height,width:width};
		let panel_div=null;
		if (!config.div){
			panel_div=$("<div>").height(height).width(width);

		}
		else{
			if (typeof config.div === 'string' ){
				panel_div=$("#"+config.div);
			}
			else{
				panel_div=$(config.div);
			}
			height=panel_div.height();
			width=panel_div.width();
		}
		this.tracks={}
		this.track_order=[];
		for (let t_config of tracks){
			if (this.fixed_height_mode){
    			t_config.discrete=true;
    		}
			let track=MLVTrack.getTrack(t_config);
			this.tracks[track.config.track_id]=track;
			this.track_order.push(track.config.track_id)
		}
		//check for linked scales
		this._tracksChanged();
		this.legend= null;

      
       	this.trackDiv = panel_div.addClass("igv-track-div").css("position","absolute");

		this.canvas = $('<canvas class = "igv-content-canvas">')[0];
        this.trackDiv.append(this.canvas);
        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);
        this.ctx = this.canvas.getContext("2d");

        if (this.show_scale){
        	this.addScaleCanvas(height);
        }

       
        this.trackDiv.append(Utils.spinner());

        let icon_div=$("<div>").css({"z-index":100,position:"absolute",top:"2px",right:"2px"}).appendTo(this.trackDiv)
        					   .attr("class","panel-icon-div")


        //for event handlers
       	this.is_dragging=false;
       	this.isMouseDown = false,
      	this.lastMouseX = undefined;
       	this.mouseDownX = undefined;

		//amount to show each side of view port
       	this.buffer_level=1;

       	this.groups={};

       	this.highlighted_regions={};

       	//listeners
		this.listeners={
       		"panel_empty":new Map(),
       		"panel_closed":new Map(),
       		"track_added":new Map(),
       		"track_removed":new Map(),
       		"view_changed":new Map(),
       		"feature_clicked":new Map(),
       		"feature_over":new Map(),
       		"range_selected":new Map()
       	};

       	if (config.allow_user_drag){
       		this.allowUserDrag();
       	}
       	if (config.allow_user_zoom){
       		this.allowUserZoom();
       	}
       	if (config.allow_user_resize){
       		this.allowUserResize(config.allow_user_resize);
       	}
       	if (config.allow_user_move){
       		this.allowUserMove(config.allow_user_move);
       	}
       	if (config.allow_user_feature_click){
       		this.allowUserFeatureClick();
       	}
       	if (config.allow_user_feature_over){
       		this.allowUserFeatureOver();
       	}
       	if (config.allow_user_close){
       		this.allowUserClose();
       	}
       	if (config.allow_user_drop){
       		this.allowUserDrop();
       	}
       	if (config.allow_user_range_selection){
       		this.allowUserRangeSelection();
       	}

       	if(config.ruler_track){
       		this.addRulerTrack();
       	}
       	if(config.legend){
       		this.addLegend();
       	}
       
       	this.retries=0;
       	this.yOffset=0;
    }

    _parseConfig(config){
    	//check the tracks have the right settings
    	if (this.fixed_height_mode){
    		config.discrete=true;
    		if (!config.height){
    			config.height=150;
    		}
    	}
    }

    addScaleCanvas(height){
    	this.scale_canvas = $('<canvas>').css({position:"absolute",top:"0px",left:"5px"});
    	this.scale_canvas[0].setAttribute('width', 100);
        this.scale_canvas[0].setAttribute('height', height);
        this.scale_canvas.appendTo(this.trackDiv);
        this.scale_ctx=this.scale_canvas[0].getContext("2d");
    }

    /**
	* sets the extra amount of track to draw each side of the view. A value 
	* of 1 will retreive 1 x the view width each side i.e. 3 x the visible window
	* @param {integer} level - The type of listener - track_empty 
	*/
    setBufferLevel(level){
    	this.buffer_level=level;
    }
    /**
	* Returns the element that houses the panel
	* @returns {integer} level - The type of listener - track_empty 
	*/

    getDiv(){
    	return this.trackDiv;
    }
    
    
    addLegend(){
    	this.legend = new PanelLegend(this);
    }

        /**
	* Sets the highligted region
	* @param {Object} location - An object containing chr, start and end
	* @param {name} The name(id) of the region (used to remove the region)
	* @param {String} The color to give the highligted region
	*/
    setHighlightedRegion(location,name,color){
    	this.highlighted_regions[name]={
    		chr:location.chr,
    		start:location.start,
    		end:location.end,
    		color:color
    	}
    	this.force_redraw=true;

    }

    /**
	* Removes the highlighted region from the panel
	* @param {string} name - The name of the highlighted region
	* that was given when it was created.
	*/
    removeHighlightedRegion(name){
    	delete this.highlighted_regions[name];
    	this.force_redraw=true;
    }




    addRulerTrack(){
    	let track=new RulerTrack();
    	let config = track.getConfig();
		this.tracks[config.track_id]=track;
		this.track_order.unshift(config.track_id);
		return this;
    }

    /**
	* Adds a listener to the panel
	* @param {string} type - The type of listener - track_empty
	* @param {function} func - The function to call 
	* @param {string} id - The id of the handler (can be used to remove the handler)
	* Optional - an id will be assigned (and returned) if not supplied
	* @returns{string} The id of the handler or null if the type did not exist 
	*/
    addListener(type,func,id){
    	let listener = this.listeners[type];
    	if (!listener){
    		return null;
    	}
    	if (!id){
    		id = type+"_"+listener.size
    	}
    	listener.set(id,func);
    	return id;
    }

    /**
	* Removes a listener to the panel
	* @param {string} type - The type of listener - track_empty 
	* @param {string} id - The id of the handler to remove
	* @returns{boolean} true if the listener was removed, otherwise false 
	*/
    removeListener(type,id){
    	let listener = this.listeners[type];
    	if (!listener){
    		return false;
    	}
    	return listener.delete(id);
    }
    
     
    /**
	* Removes a listener to the panel
	* @param {object} config - The config of the track to addTrack
	* @param {integer} index - Optional, the vertical order of the track
	*/
    addTrack(config,index){
    	let track=MLVTrack.getTrack(config);
    	if (this.fixed_height_mode){
    		track.config.discrete=true;
    	}
		this.tracks[track.config.track_id]=track;
		if (index || index==0){
			this.track_order.splice(index,0,track.config.track_id)
		}
		else{
			this.track_order.push(track.config.track_id);
		}

		this._tracksChanged();
		if (this.legend){
    		this.legend.addTrack(track.config,index);
    	}
		this._callListeners("track_added",track.config);
    }
    
    _callListeners(type,config){
    	  
         this.listeners[type].forEach(function(v){v(config)});
    }

    removeAllTracks(){
    	let dup_array = this.track_order.slice();
    	for (let id of dup_array){
    		this.removeTrack(id,true)
    	}

    }
    
	/**
	* Removes a listener to the panel
	* @param {object} config - The config of the track to add 
	*/
    removeTrack(track_id,not_repaint){
    	if (!this.tracks[track_id]){
    		return null;
    	}
    	this.track_order = this.track_order.filter(e => e !== track_id);
    	if (!not_repaint){
    		this.repaint(true,true);
    	}
    
    	if (this.legend){
    		this.legend.removeTrack(track_id);
    	}
    	let config =  this.tracks[track_id].config
    	delete this.tracks[track_id];
    	
    	this._callListeners("track_removed",config);
    	if (this.track_order.length===0){
            for (let l_id in this.listeners["panel_empty"]){
                this.listeners["panel_empty"][l_id](this);
            }
        }
        return config;

    }

    getTrackConfig(track_id){
    	let track = this.tracks[track_id];
    	return track.getConfig();
    }


    getAllTrackConfigs(){
    	let configs=[];
    	for (let id of this.track_order){
			configs.push(this.tracks[id].getConfig());
    	}
    	return configs;
    }
    
    setTrackAttribute(track_id,key,value){
    	let track = this.tracks[track_id];
    	if (!track){
    		return;
    	}
    	track.setConfigAttribute(key,value);
    	if (key==="scale_link_to"){
    		this.tracks[track_id].scale_link_to = this.tracks[value];
    	}
    	if ((key==="color" || key==="display") && this.legend){
    		this.legend.updateTrack(track_id);
    	}
    }
    
    setTrackAttributes(track_id,attributes){
    	let track = this.tracks[track_id];
    	for (let key in attributes){
    		track.setConfigAttribute(key,attributes[key]);
    		if (key==="color" && this.legend){
        		this.legend.updateTrack(track_id);
        	}
    	}
    }


    /**
	* Sets the filter  function for track. 
	* @param {string} track_id- The id of the track
	* @param {string} func - The filter function. It should accept the feature
	* and return true to dispaly the feature and false to hide it. Use null 
	* to cancel the filter
	*/
    setTrackFeatureFilter(track_id,func){
    	let track = this.tracks[track_id];
    	track.setFilterFunction(func);
    }

    /**
	* Sets the filter  function for track 
	* @param {string} track_id- The id of the track
	* @param {string} func - The color function. It should accept the feature
	* and return the feature color. Use null to go back to default colors 
	*/
    setTrackColorFunction(track_id,func){
    	let track = this.tracks[track_id];
    	track.setColorFunction(func);
    }

    setTrackLabelFunction(track_id,func){
    	let track = this.tracks[track_id];
    	if (track){
    		track.label_function=func;
    	}

    }


  




    _tracksChanged(){
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
    }


    getCurrentTrackFeatures(track_id){
    	let track = this.tracks[track_id];
    	return track.getCurrentFeatures(this.chr,this.start,this.end);
    }


    
	 
	 
	 

  

   /**
    * Updated the panel view, if chromosome start and end are supplied
    * it will go to this location. If no parameters are given the panel
    * will be redrawn at the same location e.g after the color, scale or another
    * paramter has been set
    * @param {string} force - If true then a cached image will not be used
    * @param {integer} start of the region to draw
    * @param {integer} end of the region to draw
    */

    update (chr,start,end,no_propagation) {
    	this.call_update_listener=no_propagation;
        if (chr){
            this.chr=chr;
            this.start=start;
            this.end=end;
            this.repaint();
        }
        else{
        	this.repaint(true,true);
        }


       
    };

    getTracksHeight(){
    	let h =0;
    	let groups={}
    	for (let tid of this.track_order){
    		let track=  this.tracks[tid];
    		let g = track.config.group;
    		if (g){
    			if (!groups[g]){
    				h+=track.config.height;
    				groups[g]=true;
    			}

    		}
    		else{
				h+=track.config.height;
    		}
    	}
    	return h;
    }


    getAllFeatures(bpStart, bpEnd,force,data) {
        let promises = [];
        for (let track_id  of this.track_order){
        	let track = this.tracks[track_id];
        	promises.push(track.getFeatures(this.chr,bpStart,bpEnd,force,data));       
        }
        return Promise.all(promises);    
    }

    /**
     * Repaint the view, using a cached image if available.
     * @param {boolean} force - If true then a cached image will not be used
     * @param {boolean} range_from_tile Redraw the tile
     */
    repaint(force,range_from_tile) {

       
		
        var pixelWidth,
            bpWidth,
            bpStart,
            bpEnd,
            self = this,
            ctx,
            referenceFrame,
            chr,
            refFrameStart,
            refFrameEnd,
            success;

        chr = this.chr;
        refFrameStart = this.start;
        refFrameEnd = this.end;
        this.bpPerPixel=(this.end-this.start)/this.canvas.width;
        let get_features=true;
        if (this.tile && this.tile.containsRange(chr, refFrameStart, refFrameEnd, this.bpPerPixel)){
            get_features=false;
        } 
        if (!get_features && !force && !this.force_redraw) {
            this.force_redraw=false;
            this.paintImage();
            if (!self.call_update_listener){
            	self.listeners.view_changed.forEach((func)=>{func(self.chr,parseInt(self.start),parseInt(self.end))});
            }
            self.call_update_listener=false;
       
         
            self.retries=0;
        }
        else {
            // Expand the requested range so we can pan a bit without reloading
            this.force_redraw=false;
            pixelWidth = ((this.buffer_level*2)+1) * this.canvas.width;
            bpWidth = Math.round(pixelWidth*this.bpPerPixel);
            bpStart = Math.max(0, Math.round(this.start-(this.buffer_level*this.canvas.width*this.bpPerPixel)));
            bpEnd = bpStart + bpWidth;
            if (self.loading){
            	if (force && range_from_tile){
            		self.update_required=true;
            	}
            	else{
            		self.update_required="location";
            	}
            	return;
            }
            if (range_from_tile){
            	if (this.tile){
                    bpStart=this.tile.startBP;
                    bpEnd=this.tile.endBP;
            	}
            }

         

            self.loading = {start: bpStart, end: bpEnd};
            self.trackDiv.find(".mlv-alert").remove();

            Utils.startSpinnerAtParentElement(self.trackDiv);


            self.getAllFeatures( bpStart, bpEnd,!get_features,{pixelWidth:pixelWidth,bpPerPixel:self.bpPerPixel})

                .then(function (all_features) {
                    
                   
                 

                    if (all_features) {
                        
                 
                        var buffer = document.createElement('canvas');
                        buffer.width = pixelWidth;
                        buffer.height = self.fixed_height_mode?self.getTracksHeight():self.canvas.height;
                        ctx = buffer.getContext('2d');
                        if (self.show_scale){
        					self.scale_buffer= document.createElement('canvas');
        					self.scale_buffer.width = 200;
        					self.scale_buffer.height = buffer.height;
        					self.scale_buffer_ctx=self.scale_buffer.getContext("2d");
                        }
                   
                        var options ={
                             context: ctx,
                             bpStart: bpStart,
                             bpPerPixel: self.bpPerPixel,
                             pixelWidth: buffer.width,
                             pixelHeight: buffer.height,
                             chr:chr
                        };
                        let top=0;
                        self.groups={};
                        self.calculateMaxScale(all_features);
                        for (var i in all_features){
                        	let track = self.tracks[self.track_order[i]];
                        	options.features=all_features[i];
                        	let group = track.config.group
                        	if (group){
                        		if (!self.groups[group]){
                        			self.groups[group]={top:top,height:track.config.height}
                        			//first time increase top
                        			top+=track.config.height;
                        		}
                        		options.top=self.groups[group].top;
                        		options.height=self.groups[group].height;

                        	}
                        	else{
                        		options.top =top;
                        	}
                        	
                        	let disc =   self.fixed_height_mode || track.config.discrete || group;
                        	if (disc){
                        		let h=group?options.height:track.config.height;
                        		ctx.save();
								ctx.rect(0,options.top,options.pixelWidth,h);
								ctx.clip();
								ctx.beginPath();
                        	}
                            let offset= track.drawFeatures(options);
                            
                            if (disc ){
                            	ctx.restore()
                            	if (!group){
                         			top+=track.config.height;
                         			track.bottom=top;
                            	}
                            }
                            else if (offset){
                            	top=offset;
                            }
                            
                            if (self.show_scale){

                            	track.drawScale(options.pixelHeight,self.scale_buffer_ctx);
                            }
                                      
                        }
                        for (let name in self.highlighted_regions){
                        	let region = self.highlighted_regions[name];
                        	if (self.chr !== region.chr){
                        		continue;
                        	}
                        	if (region.end<bpStart ||region.start>bpEnd){
                        		continue
                        	}
                        	self.drawHighlightedRegion(region,options);
                        }
                        self.retries=0;
                        self.loading = false;
                        self.tile = new Tile(chr, bpStart, bpEnd, self.bpPerPixel, buffer);
                        self.paintImage();
                        if (!self.call_update_listener){
                        	self.listeners.view_changed.forEach((func)=>{func(self.chr,parseInt(self.start),parseInt(self.end))});
                        }
                        self.call_update_listener=false;
                    
                    }
                    else {
                        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                    }
                    if (self.update_required){
                    	if (self.update_required==="location"){
                    		self.update(self.chr,self.start,self.end);
                    		self.update_required=false;
                    	}
                    	else{
                    		self.update_required=false;
                    		self.update();
                    	}
                    }	
                    Utils.stopSpinnerAtParentElement(self.trackDiv);

                })
                .catch(function (error) {
                    self.loading = false;
                  
                    console.log(error);
                    if (self.retries<3 && error!=="Timed out"){
                    	self.retries++;
                    	self.repaint(force,range_from_tile);
                    }
                   
                    else{
                        Utils.stopSpinnerAtParentElement(self.trackDiv);
                        self.loading=false;
                        self.force_redraw=true;
                        Utils.presentAlert(self.trackDiv,error);
                    }
                });
        }


        function viewIsReady() {
            return this.track;
        }
 
    }


    autoScale(features,min,max){
                if (!features){
                	return({min:0,max:1})
                }
        		features.forEach(function (f) {
            		min = Math.min(min, f.value);
           			max = Math.max(max, f.value);
        		});
        		return {min: min, max: max};
    		
    }

    calculateMaxScale(all_features){
    	  let groups={};
    	  for (var i in all_features){
              let track = this.tracks[this.track_order[i]];
              track.set_scale=null;
              let group =track.config.group;
             if (group && track.config.scale!=="fixed" && !(track.config.scale_link_to)){
             		track.config.scale_group=group;
             }       	
             group = track.config.scale_group
             if (group){
             	let group_info= groups[group];
             	if (!group_info){
             		group_info={tracks:[track],features:[all_features[i]]}
             		groups[group]=group_info

             		
             	}
             	else{
             		group_info.features.push(all_features[i]);
             		group_info.tracks.push(track);
             	}
             
             }
    	  }
    	  for (let name in groups){
    	  	let g= groups[name];
    	  	if (!g.ignore){
    	  		let min=0;
    	  		let max = -Number.MAX_VALUE;
    	  		let scale=null;
    	  		for (let f of g.features){
    	  			 scale= this.autoScale(f,min,max)
    	  			 min= scale.min;
    	  			 max=scale.max;
    	  		}
    	  		for (let t of g.tracks){
    	  			t.set_scale=scale;
    	  		}
    	  	}
    	  } 
    }

    drawHighlightedRegion(region,options){
    	let start= (region.start-options.bpStart)/options.bpPerPixel;
    	start = start<0?0:start;

    	let width = (region.end-region.start)/options.bpPerPixel;
    	width = width<3?3:width;
    	width =width>options.pixelWidth?options.pixelWidth:width;
		options.context.globalAlpha=0.1;
		options.context.fillStyle=region.color;
    	options.context.fillRect(start,0,width,options.pixelHeight);
    	options.context.globalAlpha=1.0;
    }
    

    paintImage() {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.show_scale){
        	this.scale_ctx.clearRect(0, 0,100, this.canvas.height);
        	this.scale_ctx.drawImage(this.scale_buffer,0,this.yOffset)
        }

        if (this.tile) {
            this.xOffset = Math.round((this.tile.startBP - this.start)/this.bpPerPixel);
            this.ctx.drawImage(this.tile.image, this.xOffset, this.yOffset);
            this.ctx.save();
            this.ctx.restore();
        }
    };

    allowUserFeatureOver(){
    	let self = this;

    	 this.trackDiv.on("mousemove.feature_over",function (e) {
    	 	if (self.loading){
    	 		return;
    	 	}
    	 	clearTimeout(self.moto);
    	 	self.moto=setTimeout(function(){
    	 		if (!self.is_dragging){
					let info=self.getFeatureAt(e);
					let i = self.mouse_over_feature;
					if (info.feature ){
						if(i && i.feature!==info.feature){
							self.listeners.feature_over.forEach((func)=>{func(i.track,i.feature,e,"out")});
						}
					
						if ((!i) || (i.feature!==info.feature)){
							self.listeners.feature_over.forEach((func)=>{func(info.track,info.feature,e,"over")});
							self.mouse_over_feature=info;
						}
					}
					else{
						let i = self.mouse_over_feature
						if (i){
							self.listeners.feature_over.forEach((func)=>{func(i.track,i.feature,e,"out")});
							self.mouse_over_feature=null;
						}
					}
    	 		}
    	 	},10);
    	 });

    }

    removeFeatureOverHandler(){
    		this.trackDiv.off("mousedown.feature_over");
    }


	allowUserFeatureClick(){
    	let self = this;

    	this.allowUserFeatureOver();
    	this.addListener("feature_over",function(track,feature,over,type){
    		if(!feature){
    			self.trackDiv.css("cursor","default")
    		}
    		let pointer=(type==="over")?"pointer":"default";
    		self.trackDiv.css("cursor",pointer);

    	})

    	 this.trackDiv.on("mousedown.feature_click",function (e) {
    	 	if (self.loading){
    	 		return;
    	 	}
    	 	clearTimeout(self.to);
    	 	self.to=setTimeout(function(){
    	 		if (!self.is_dragging){
					let info=self.getFeatureAt(e);
					if (info.track){
						self.listeners.feature_clicked.forEach((func)=>{func(info.track,info.feature,e)});
					}
    	 		}
    	 	},200);
    	 });

    }


    removeFeatureOverHandler(){
    	this.trackDiv.off("mousedown.feature_click");
    }



    allowUserDrag(){
    	let self=this;
    	 this.trackDiv.on("mousedown.draghandler",function (e) {
    	 	if (e.shiftKey){
    	 		return;
    	 	}
            var canvasCoords = Utils.translateMouseCoordinates(e, self.canvas);
            self.isMouseDown = true;
            self.start_dragging=true;
            self.lastMouseX = canvasCoords.x;
            self.lastMouseY= canvasCoords.y;
            self.mouseDownX = self.lastMouseX;

        })
       	.on("mousemove.draghandler",function (e) {
            let canvasCoords = Utils.translateMouseCoordinates(e, self.canvas);
            if (self.is_dragging || self.start_dragging){
                var diff = canvasCoords.x-self.lastMouseX;
                var bp_diff=self.bpPerPixel*diff;
                self.start-=bp_diff;
                self.end-=bp_diff;
                let dd = self.canvas.height-self.tile.image.height;
                let y_diff=0;
                if (dd<0 || self.yOffset !==0){
                	let y_diff=  canvasCoords.y-self.lastMouseY;
                	self.yOffset+=y_diff;
                	if (self.yOffset>0){
                		self.yOffset=0;
                	}
                	else if (self.yOffset<dd){
						self.yOffset=dd;
                	}
                }
                self.repaint();
                self.lastMouseX=canvasCoords.x;
                self.lastMouseY=canvasCoords.y;
                if (self.start_dragging && (diff>5 || y_diff>5)){
                	self.is_dragging=true;
                	self.start_dragging=false;
                }
               }
        })
        .on("mouseup.draghandler",function (e) {   
              self.is_dragging=false;
              self.start_dragging=false;
        });
        return this;
    }

    removeDragHandler(){
    	this.trackDiv.off("mousedown.draghandler mousemove.draghandler mouseup.draghandler");
    }

    _getCoords(e){
    	 let x = e.pageX - $(this.canvas).offset().left;
         let y = e.pageY - $(this.canvas).offset().top;
         return {x,y};
    	
    }


    allowUserZoom(){
    	let self = this;
    	this.trackDiv.on('mousewheel.zoom  mouse.zoom DOMMouseScroll', function(event) {
			let deltaY= event.originalEvent.deltaY;
			if (deltaY === undefined){
				deltaY=event.originalEvent.detail
			}
    	 	if (self.loading || (self.bpPerPixel<0.05 && deltaY>0)){
    	 		return;
    	 	}
    	 	
   
    	 	let canvasCoords = self._getCoords(event.originalEvent);
            let factor = deltaY<0?2:0.5;
            let mbp= (self.start+ canvasCoords.x * self.bpPerPixel)
            let new_length = (self.end-self.start)*factor;
            let new_start = mbp-((canvasCoords.x/self.canvas.width)*new_length);
            self.start=  new_start
            self.end= new_start+new_length;
            
            self.repaint();      
         });
         return this;
         
    }

    disableUserZoom(){
		this.trackDiv.off("mousewheel.zoom");
    }
    
    
    allowUserRangeSelection(){
        let self = this;
        this.trackDiv.on("mousedown.selection",function(e){
            if (e.shiftKey){
                self.start_select =Utils.translateMouseCoordinates(e,this).x;
                let left = self.start_select+"px";
                let td = $(this);
                self.select_div=$("<div>").css({"position":"absolute","opacity":0.2,"background-color":"blue","top":"0px","height":td.css("height"),left:left,"width":"0px"})
                .appendTo(td);
              
                e.stopPropagation();
            }
        })
        .on("mousemove.selection",function(e){
            if (e.shiftKey && self.start_select){
                let x=Utils.translateMouseCoordinates(e,this).x;
                if (x<self.start_select){
                    self.select_div.css({"left":x+"px","width":(self.start_select-x)+"px"});
                }
                else{
                   
                     self.select_div.css({"left":self.start_select+"px","width":(x-self.start_select)+"px"});
                }
             
                e.stopPropagation();
            }
        })
        .on("mouseup.selection",function(e){
            if (self.start_select){
                let x=Utils.translateMouseCoordinates(e,this).x;
                let start = self.start + (self.start_select*self.bpPerPixel);
                let end =  self.start + (x*self.bpPerPixel);
                self.start_select=null;
                self.select_div.remove();
                if (start>end){
                	let temp=end;
                	end=start;
                	start=temp;
                }
                self.listeners.range_selected.forEach((func)=>{func(self.chr,start,end)});
            }
        });

    }

    
    removeAllowSelection(){
    	this.trackDiv.off("mousedown.selection mousemove.selection mouseup.selection");
    }

    getImage(){
    	 var imgURL = this.canvas[0].toDataURL(MIME_TYPE);
    }
    
    
    allowUserDrop(){
        let div = this.trackDiv;
        let self = this;
        div.droppable({
        	over:function(e,ui){
        		let track = ui.draggable.data("track");
        		let panel = ui.draggable.data("panel");
        		if (panel===self){
        			return;
        		}
        		if  (track ){
        			let icon = "<span class='ui-icon ui-icon-check'></span>";
        			if (track.no_drop || self.tracks[track.track_id]){
        				icon="<span class='ui-icon  ui-icon-closethick'></span>"
        			}
        			setTimeout(()=>{
        			ui.helper.prepend(icon).css("white-space","nowrap");
        			},20);

        		}
        	},
        	greedy:true,
        	out:function(e,ui){
        		ui.helper.find(".ui-icon").remove();
        	},
            drop:function(e,ui){
                 let track = $(ui.draggable[0]).data("track");
                 ui.helper.find(".ui-icon").remove();

                 if (!track){
                     return
                 }
                 let panel=$(ui.draggable[0]).data("panel");

                 if (panel===self || track.no_drop || self.tracks[track.track_id]) {  
                     return;
                 }
                 else{
                	 if (panel){
                		 panel.removeTrack(track.track_id);
                		 panel.update();
                	 }
                      self.addTrack(track);
                      self.update();
                 }
            }
        });
        return this;
    }

    
    /**
	* Gets the feature that was clicked
	* @param {JQuery Event} e - Can be any object- all that is required is pageX and PageY
	* @returns {object} An object with track - the track config at the event position(or null) and
	* feature - the feature at the postition (or null). 
	*/

     getFeatureAt(e){
    	 let co = Utils.translateMouseCoordinates(e, this.canvas);
    	 co.y-=this.yOffset;
    	 let gl = Math.round(this.start+(co.x*this.bpPerPixel));
    	 for (let t in this.tracks){
    	 	let track = this.tracks[t];
    	 	if (co.y>track.top && co.y<track.bottom){
    	 		return {track:track,
    	 				feature:track.getFeatureAt(gl,this.chr,co,this.bpPerPixel,this.ctx,this.yOffset)
    	 		};
    	 	}		
    	 }
    	 return {track:null,feature:null};
    }
    

    allowUserResize(direction){
    	let handles="all";
    	if (direction==="vertical"){
    		handles="n,s";
    	}
    	else if (direction==="horizontal"){
    		handles="e,w";
    	}
        let div = this.trackDiv;
        let self = this;
		
        div.resizable({
          
            resize:function(e,ui){
            	e.stopPropagation();
            	if (self.loading){
            		return false;
            	}

            	clearTimeout(self.to);
            	self.to=setTimeout(function(e){
            		self.setWidth(ui.size.width);
            		self.setHeight(ui.size.height);
            		self.update();
            	},100)
                
            },
            handles:handles

        });
        return this;
    }

     /**
	* Allows the user to move the panel via a handle in the
	* top right hand corner
	* @param {string} direction - either vertical or horzontal, will restrict movement 
	* in this plane
	* @param {boolean} if true then the panel will be constrained within its parent 
	*/
    allowUserMove(direction,contain){
    	let axis=false;
    	let icon= "fa-arrows-alt";
    	if (direction=="vertical"){
    		axis="y";
    		icon +="-v";
    	}
    	else if (direction=="horizontal"){
    		axis="x";
    		icon+="-h";
    	}
    	let div = this.trackDiv;
		div.find(".panel-icon-div").prepend($("<span class='track-handle fas "+icon+"'></span>").css({"cursor":"move"}));
        let self =this;
        let c=false;
        if (contain){
        	c="parent";
        }
        div.draggable({handle:".track-handle",axis:axis,containment:c});
        return this;
    }

    allowUserClose(){
		let div = this.trackDiv;
		let self =this;
		let icon=$("<span class='fas fa-trash'></span>")
				.click(()=>{
					  self.listeners.panel_closed.forEach((func)=>{func(self)});
						div.remove()
				});
		div.find(".panel-icon-div").append(icon);
    }

    setWidth(width){
        this.trackDiv.width(width);
        this.canvas.setAttribute('width', width);
    }

    setHeight(height){
        $(this.trackDiv).height(height);
        this.canvas.setAttribute('height',height);
        if (this.show_scale){
        	this.scale_canvas[0].setAttribute("height",height);
        }
    }

    
    redrawTile(features) {

        if (!this.tile) return;

        var self = this,
            chr = self.tile.chr,
            bpStart = self.tile.startBP,
            bpEnd = self.tile.endBP,
            buffer = document.createElement('canvas'),
            bpPerPixel = self.tile.scale;

        buffer.width = self.tile.image.width;
        buffer.height = self.tile.image.height;
        var ctx = buffer.getContext('2d');

      

        self.track.draw({
            features: features,
            context: ctx,
            bpStart: bpStart,
            bpPerPixel: bpPerPixel,
            pixelWidth: buffer.width,
            pixelHeight: buffer.height
        });


        self.tile = new Tile(chr, bpStart, bpEnd, bpPerPixel, buffer);
        self.paintImage();
    }

}


class Tile{
	constructor (chr, tileStart, tileEnd, scale, image) {
		this.chr = chr;
		this.startBP = tileStart;
		this.endBP = tileEnd;
		this.scale = scale;
		this.image = image;
	}

	containsRange(chr, start, end, scale) {
		if (start<0){
			start=0;
		}
		return this.scale.toFixed(3) === scale.toFixed(3) && start >= this.startBP && end <= this.endBP && chr === this.chr;
	}

	overlapsRange(chr, start, end) {
		return this.chr === chr && this.endBP >= start && this.startBP <= end;
	}
}



	 
export {MLVPanel};