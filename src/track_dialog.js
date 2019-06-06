import {MLVTrack} from "./tracks.js";


class MLVTrackDialog{
    constructor(config,panel){
        this.config = MLVTrack.parseConfig(config);
        this.panel=panel;
        this.div = $("<div>").attr("class","mlv-track-dialog");
        this.id=MLVTrackDialog.id++;
        
        this.div.dialog({
       		autoOpen: true, 
            close:function(){
                $(this).dialog('destroy').remove();
            },
        	title: this.config.short_label,
        	width:250
       
        }).dialogFix();
        this.init();  
    }

    _updatePanelScale(){
        if (!this.panel){
            return;
        }
        this.panel.setTrackAttribute(this.config.track_id,"max_y",this.config.max_y);
        this.panel.setTrackAttribute(this.config.track_id,"min_y",this.config.min_y);
        this.panel.update();
    }
        
    init(){
        let self=this;

        let color_input=$("<input>").attr({type:"color"})
        .change(function(e){
            let color = $(this).val();
            self.config.color=$(this).val();
            if (self.panel){
                self.panel.setTrackAttribute(self.config.track_id,"color",self.config.color);
                self.panel.update();
            }
        });
        let color_div=$("<div class='t-d-div'></div>");
        color_div.append("<label>Color</label><br>");
        color_div.append(color_input).appendTo(this.div);
        color_input.val(self.config.color).height(15);
        this.div.append("<hr>");
        if (this.config.format==="wig"){
            let scale_name= "sc-ra-name-"+this.id
            let scale_div = $("<div class='t-d-div'></div>").append("<label>Scale</label><br>");
            scale_div.append($("<input>").attr({type:"radio",value:"automatic",checked:this.config.scale==="automatic",name:scale_name}))
            scale_div.append($("<span>").text("Automatic"));
            scale_div.append($("<input>").attr({type:"radio",value:"fixed",checked:this.config.scale==="fixed",name:scale_name}))
            scale_div.append($("<span>").text("Fixed"));
            scale_div.append($("<input>").attr({type:"radio",value:"dynamic",checked:this.config.scale==="dynamic",name:scale_name}))
            scale_div.append($("<span>").text("Dynamic"));
            scale_div.appendTo(this.div);
            $("input[name='"+scale_name+"']").click(function(e){
                let scale=$("input[name='"+scale_name+"']:checked").val();
                self.config.scale=scale;
                if (self.panel){
                    self.panel.setTrackAttribute(self.config.track_id,"scale",scale);
                    delete self.panel.tracks[self.config.track_id].max_y;
                    self.panel.update();
                }
            });
            self.scale_slider =$("<div>").slider({

                range: true,
                min: self.config.min_y,
                max: self.config.max_y,
                values: [ self.config.min_y,self.config.max_y ],
                slide: function( event, ui ) {
                    self.config.max_y= ui.values[ 1 ];
                    self.config.min_y= ui.values[ 0 ];
                    self._updatePanelScale();
                    self.min_y_input.val(ui.values[0]);
                    self.max_y_input.val(ui.values[1]);
                }
            }).css("margin","5px 3px");
            self.scale_slider.appendTo(scale_div);
            self.scale_slider.slider("option","values",[self.config.min_y,self.config.max_y]);
            self.min_y_input=$("<input>").on("blur keypress",function(e){
                if (e.type==="keypress" && !(e.which===13)){
                    return;
                }
                let y =self.min_y_input.val();
                y=parseFloat(y);
                if (y<self.config.min_y){
                    self.scale_slider.slider("option","min",y);
                }
                self.scale_slider.slider("option","values",[y,self.config.max_y]);
                self.config.min_y=y;
                self._updatePanelScale();

                
            }).appendTo(scale_div).width(40).val(self.config.min_y);
            self.max_y_input=$("<input>").on("blur keypress",function(e){
                 if (e.type==="keypress" && !(e.which===13)){
                    return;
                }
                let y =self.max_y_input.val();
                y=parseFloat(y);
                let range  = y - self.min_y_input.val();
                self.scale_slider.slider("option","step",range/100);
                self.scale_slider.slider("option","max",y);
                self.scale_slider.slider("option","values",[self.config.min_y,y]);
                self.config.max_y=y;
                self._updatePanelScale();

                
            }).appendTo(scale_div).width(40).css({"float":"right"}).val(self.config.max_y);
            if (self.config.scale_link_to){
            	let label = this.panel.tracks[self.config.scale_link_to].config.short_label;
            	scale_div.find("label").text("Scale(linked to "+label+")");
            	scale_div.find("input").attr("disabled",true);
            	self.scale_slider.slider("disable");
            }


            this.div.append("<hr>");
   
          
            let display_name= "di-ra-name-"+this.id;
            let display_div = $("<div class='t-d-div'></div>").append("<label>Display</label><br>");
            display_div.append($("<input>").attr({type:"radio",value:"fill",checked:this.config.display==="fill" || !this.config.display_type,name:display_name}))
            display_div.append($("<span>").text("Fill"));
            display_div.append($("<input>").attr({type:"radio",value:"line",checked:this.config.display==="line",name:display_name}))
            display_div.append($("<span>").text("Line"));
            this.div.append(display_div);
             $("input[name='"+display_name+"']").click(function(e){
                let display=$("input[name='"+display_name+"']:checked").val();
                self.config.display=display;
                if (self.panel){
                    self.panel.setTrackAttribute(self.config.track_id,"display",display);
                    self.panel.update();
                }
            });
            display_div.append("<br>");
        
           
       
            display_div.append("<label>group:</label>").append("<br>");
            let input= $("<input>").on("blur keypress",function(e){
                 if (e.type==="keypress" && !(e.which===13)){
                    return;
                }
                self.config.group=$(this).val();
                self.panel.setTrackAttribute(self.config.track_id,"group",self.config.group);
                self.panel.update();

            });
            input.val(this.config.group).appendTo(display_div);
         
     		this.div.append("<hr>");
		}
		    let discrete_div=$("<div>").append("<label>Discrete</label>");
            let check = $("<input>").attr({type:"checkbox"}).prop("checked",this.config.discrete)
                .click(function(e){
                    self.config.discrete=$(this).prop("checked");
                    if (self.panel){
                        self.panel.setTrackAttribute(self.config.track_id,"discrete",self.config.discrete);
                        self.panel.update();
                    }
                    if (self.config.discrete){
                    	self.height_div.show();
                    }
                    else{
                    	self.height_div.hide();
                    }
                }).appendTo(discrete_div);
            if (this.panel.fixed_height_mode){
            	check.attr("disabled",true);
            }
            discrete_div.appendTo(this.div);



       	// if (this.config.discrete || this.panel.fixed_height_mode){
       	this.height_div=$("<div class='t-d-div'></div>");
        	
		this.height_div.append("<label>height:</label>").appendTo(this.div);

        let height_slider =$("<div>").slider({
         	min: 10,
            max: 500,
            value:self.config.height,
            slide: function( event, ui ) {
            	self.config.height= ui.value;
                self.panel.setTrackAttribute(self.config.track_id,"height",self.config.height);
                self.panel.update(); 
            }
		}).css({"margin":"5px 3px"});
        height_slider.appendTo(this.height_div);
        if (!(self.panel.fixed_height_mode)){
        	if (!(self.config.discrete)){
        		this.height_div.hide();
        	}
        }
 

   

       

       

   	 if (this.config.format==="feature" || this.config.type==="bam"){

    let feature_div=  $("<div>").append("<label>Feature Height</label><br>");
    self.feature_height_slider=$("<div>").slider({
       max:40,
       min:3,
       slide:function(e,ui){
           self.config.featureHeight=ui.value;
           if (self.panel){
                self.panel.setTrackAttribute(self.config.track_id,"featureHeight",self.config.featureHeight);
                self.panel.update();
           }
       } 
    });
    self.feature_height_slider.slider("option","value",self.config.featureHeight);
    feature_div.append(self.feature_height_slider).appendTo(this.div);
    this.div.append("<hr>");
    }
    if (this.config.format==="feature"){

    let feature_display_div=  $("<div>").append("<label>Display</label><br>");


    self.feature_display_select=$("<select>").append("<option>EXPANDED</option>")
            .append("<option>SQUISHED</option>")
            .append("<option>COLLAPSED</option>")
            .change(function(e){
                self.config.displayMode=$(this).val();
                if (self.panel){
                    self.panel.setTrackAttribute(self.config.track_id,"displayMode",self.config.displayMode);
                    self.panel.update();
                }
             }).val(self.config.displayMode);
    feature_display_div.append(self.feature_display_select).appendTo(this.div);
    this.div.append("<hr>");
    }

    let op_div=$("<div>").append("<label>Opacity</label><br>");

    self.opacity_slider= $("<div>").slider({
        max:1.0,
        min:0.0,
        step:0.05,
        slide:function(e,ui){
            self.config.opacity = ui.value;
            if (self.panel){
                self.panel.setTrackAttribute(self.config.track_id,"opacity",self.config.opacity);
                self.panel.update();
            }
        }
    })
    op_div.append(self.opacity_slider).appendTo(this.div);
    self.opacity_slider.slider("option","value",self.config.opacity);
    let track = this.panel.tracks[this.config.track_id];
    track.addExtraControls(this);

  

   let p = this.div.parent();

    }       
}

class AddTrackDialog{
	constructor(callback){
        this.div = $("<div>").attr("class","add-track-dialog");
        this.id=MLVTrackDialog.id++;
        this.callback=callback
        let self=this;
        this.div.dialog({
       		autoOpen: true,
       		buttons:[{
       			text:"Add",
       			click:function(e){
       				self.getConfig()
       				$(this).dialog("close");
       			}
       		}],
            close:function(){
                $(this).dialog('destroy').remove();
            },
        	title: "Add Track",
        	width:250
       
        }).dialogFix();
        this.track_types=["bigwig","bed","ucsc_track","line","bigbed","fasta"]; 

        this.init();
      

	}

	getConfig(){
		
		let name= "track-add-radio-"+this.id
		let type = $("input[name='"+this.type_radio+"']:checked").val();
		let config= {url:this.url_input.val(),type:type,short_label:this.name_input.val()};
		this.callback(config);
		
	}

	init(){
		let self=this;
		this.div.append("<label>Paste URL</label>");
		this.url_input= $("<textarea>").appendTo(this.div).css({width:"95%"});
		this.url_input.on("blur keypress",function(e){
			if (e.originalEvent.type==="keypress" &&  e.charCode !==13){
				return;
			}
			self._getInfoFromUrl(($(this).val()))
		

		});
		this.div.append($("<label>Name</label>"));
		this.name_input = $("<input>").appendTo(this.div);
		this.div.append($("<label>Type</label>"));
		let radio_div=$("<div>").appendTo(this.div);
		this.type_radio= 'track-add-radio-'+this.id
		for (let type of this.track_types){
			this.addRadioButton(radio_div,type);
		}

	}

	setAddFunction(func){
		this.callback=callback;
	}

	_getInfoFromUrl(url){
		let type = MLVTrack.getTypeFromURL(url).type
		let name = MLVTrack.calculateLabel(url);
		if (url.includes("hgTracks")){
			name = "UCSC Session";
			type= "ucsc_track"
		}
		this.name_input.val(name);
		$("[name='"+this.type_radio+"']").val([type]);

	}

	addRadioButton(div, type){
		let sp =$("<span>").css({"display":"inline-block","margin-right":"3px"});
		sp.append($("<input>").attr({type:"radio",value:type,name:this.type_radio}));
		sp.append($("<span>").text(type));
		div.append(sp);

	}

	


}


MLVTrackDialog.id=0;

export {MLVTrackDialog,AddTrackDialog};