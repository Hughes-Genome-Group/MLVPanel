import {MLVPanel} from "../panel.js";

class SimpleBrowser{
	 /**
     * Creates a filter panel
     * @param {string } parent_div- The id of the div element to house the browser
     * @param {Object} [config] - config of how the browser is constructed
     * <ul>
     * <li>add_controls - if true then a control bar is added (default false)</li>
     * <li>add_ruler - if true a ruler track will be added (default false)
     * </ul>
     */
	constructor(parent_div,config){
		if (!config){
			config={};
		}
		if (config.limit_chromosome){
			this.limit_chromosome=config.limit_chromosome;
		}
		this.div = $("#"+parent_div).css({"padding":"2px","overflow":"hidden"});
		this.listeners= {};
		if (config.add_controls){
			this.addControls();
		}
		this.width=this.div.width();
		this.panels={};
		this.chr="";
		this.start=1;
		this.end=10000;
		if (config.add_ruler){
			this.addPanel("ruler");
		}
	
		let self = this;
		$(window).on("resize",function(e){
			if (!e.target.open){
				return;
			}
			self.setWidth();
		});
		
		this._addHandlers();	
	}
	
	_addHandlers(){
		let self = this;
		this.div.on('mousewheel.zoom  mouse.zoom', function(event) {
			event.stopPropagation();
			event.preventDefault();
    	 	if (self._isLoading() || (self.bp_per_pixel<0.05 && event.originalEvent.deltaY>0)){
    	 		return;
    	 	}
    	 	let canvasCoords = self._translateCoOrds(event);
            let factor = event.originalEvent.deltaY<0?2:0.5;
            let mbp= (self.start+ canvasCoords.x * self.bp_per_pixel)
            let new_length = Math.round((self.end-self.start)*factor);
            let new_start = Math.round(mbp-((canvasCoords.x/self.width)*new_length));
            self.goToPosition(self.chr,new_start,new_start+new_length)
         });
		
		 this.div.on("mousedown.draghandler",function (e) {
	    	 	if (e.shiftKey){
	    	 		return;
	    	 	}
	            var canvasCoords =self._translateCoOrds(e);
	            self.isMouseDown = true;
	            self.start_dragging=true;
	            self.lastMouseX = canvasCoords.x;
	            self.mouseDownX = self.lastMouseX;

	        })
	       	.on("mousemove.draghandler",function (e) {
	            let canvasCoords =self._translateCoOrds(e);
	            if ($._no_drag){
	            	self.is_dragging=false;
	            	return;
	            }
	            if (self.is_dragging || self.start_dragging){
	                var diff = canvasCoords.x-self.lastMouseX;
	                if (self._isLoading()){
	                	return;
	                }
	                var bp_diff=self.bp_per_pixel*diff;
	                let start =self.start-=bp_diff;
	                let end =self.end-=bp_diff;
	                self.goToPosition(self.chr,start,end);
	                
	                self.lastMouseX=canvasCoords.x;
	                if (self.start_dragging && diff>30){
	                	self.is_dragging=true;
	                	self.start_dragging=false;
	                }
	               }
	        })
	        .on("mouseup.draghandler",function (e) {   
	              self.is_dragging=false;
	              self.start_dragging=false;
	        });
	       
	}
	
	_translateCoOrds(e){
		  let x = e.pageX - this.div.offset().left;
          let y = e.pageY - this.div.offset().top;
          return {x,y};
	}
	
	_isLoading(){
		for (let p_id in this.panels){		
			if (this.panels[p_id].loading){
				return true;
			}
		}
		return false;
	}

	setHighlightedRegion(location,name,color){
		for (let id in this.panels){
			if (id === "ruler"){
				continue;
			}
			this.panels[id].setHighlightedRegion(location,name,color);
			


		}
	}
	removeHighlightedRegion(name){
		for (let id in this.panels){
			this.panels[id].removeHighlightedRegion(name);
		}
	}
	
	addControls(){
		let div =$("<div>").attr("id","mlv-iv-control-panel").appendTo(this.div);
		this.control_panel = new BrowserControls("mlv-iv-control-panel",this,this.limit_chromosome);
		let new_div=$("<div>").css({"height":"calc(100% - 30px)","width":"calc(100% - 5px)","position":"absolute","top":"30px"}).appendTo(this.div);
		this.div=new_div;
	}
	

	 /**
     * Adds a panel to the browser Creates a filter panel
     * @param {string } id - The id of track 
     * @param {Object[]} track_config - The config describing the tracks in the panel
     * @param {number} top - The position of the top of the panel(in pixels)
     * @param {number} height- The height of the panel (in pixels)
     */
	addPanel(id,track_config,top,height,is_ruler){
		let ruler=false;
		if (id==="ruler"){
    		track_config=[];
    		ruler=true;
    		top=5;
    		height=40;
    	}
		let self = this;
    	let panel_config={
			height:height,
			width:this.div.width(),
			allow_user_move:"vertical",
			allow_user_resize:"vertical"
    	}
    	
    	
    	let p = new MLVPanel(track_config,panel_config);
    	if (ruler){
    		p.addRulerTrack();
    		p.allowUserRangeSelection();
    		p.addListener("range_selected",function(chr,start,end){
    			self.goToPosition(chr,start,end);
        	});
    		
    	}
    	else{
    		p.addLegend();
    	}
    	this.panels[id]=p;
    	//set panel position and add it to DOM
    	let div = p.getDiv();
    	div.css({top:top+"px",left:"0px"}).width(this.width).appendTo(this.div);
    	div.draggable( "option", "containment", "parent" );
    	$(".track-handle").removeClass("fa-arrows-alt-v").addClass("fa-arrows-alt");
    	if (!ruler){
    		div.append($("<i class='fas fa-arrows-alt-v'></i>").css({"position":"absolute","bottom":"-5px","right":"7px","font-size":"12px","opacity":"0.8"}));
    	}
    	
    	
	}
	
	_positionChanged(chr,start,end){
		this.chr=chr;
		this.start=start;
		this.end=end;
		this.bp_per_pixel=(this.end-this.start)/this.width;
		let callback = this.listeners['view_changed'];
		if (callback){
			callback(chr+":"+Math.round(start)+"-"+Math.round(end));
		}
	}
	
	getPosition(){
		return {
				chr:this.chr,
				start:this.start,
				end:this.end
			};
	}
	setWidth(){
		this.width = this.div.width();
		for (let p_id in this.panels){
			this.panels[p_id].setWidth(this.width);
			this.panels[p_id].update();
		}
	}
	
	zoom(amount){
		let range = this.end-this.start;
		let middle =this.start+range/2;
		let new_range =(range/amount);
		let st = Math.round(middle-new_range/2);
		let en = Math.round(middle+new_range/2);
		this.goToPosition(this.chr,st,en);
	}

	/**
    * Displays the specified genomic location
    * @param {string } chr - chromosome 
    * @param {number} start - The start of the genomic location
    * @param {number} end - The end of the genomic location
    */
	goToPosition(chr,start,end){
		for (let p_id in this.panels){
			this.panels[p_id].update(chr,start,end);
		}
		this._positionChanged(chr,start,end);
		
	}
	
	addListener(type,func){
		this.listeners[type]=func;
	}
}



class BrowserControls{
	constructor(element_id,browser,limit_chromosome){
		this.browser=browser;
		this.limit_chromosome=false;
		if (limit_chromosome){
			this.limit_chromosome=limit_chromosome;
		}
		this.container=$("#"+element_id).css({"padding-left":"20px"});
		this.container.append("<label>zoom</label>")
		this.zoom_level_input=$("<input>").val("2").width(15).appendTo(this.container);
		this.zoom_level_input.spinner({step:1});
		let self= this;
		this.zoom_in = $("<i>").attr("class","fa fa-search-plus mlv-click-icon ")
		.appendTo(this.container)
		.click(()=>{
			this.browser.zoom(this.zoom_level_input.val());
		});
		this.zoom_out =  $("<i>").attr("class","fa fa-search-minus mlv-click-icon ")
		.appendTo(this.container)
		.click(()=>{
			this.browser.zoom(1/this.zoom_level_input.val());
		});
		let l_l=this.limit_chromosome?this.limit_chromosome:"Location";
	

		this.container.append($("<label>").text(l_l).css({"margin-left":"10px"}))
		this.location_input=$("<input>").css("width","200px")
		.appendTo(this.container)
		.keypress(function(e){
			if (e.keyCode===13){
				let loc =self.calculatePosition($(this).val());
				self.browser.goToPosition(loc.chr,loc.start,loc.end)
			}	
		});
		this.browser.addListener("view_changed",function(location){
			if (self.limit_chromosome){
				location =  location.split(":")[1];
			}	
			self.location_input.val(location);
		})

	}

	calculatePosition(text){
		text=text.replace(/,/g,"");
	
		let arr = text.split(":");
		let chr = null;
		let pos = null;
		if (arr.length===1){
			chr = this.browser.getPosition().chr;
			pos=arr[0]
		}
		else{
			chr =arr[0];
			pos=arr[1];
		}
		let arr2= pos.split("-");
		return ({chr:chr,start:parseInt(arr2[0]),end:parseInt(arr2[1])});
	}
}




export {SimpleBrowser,BrowserControls};