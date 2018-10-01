import {MLVTrack} from "./tracks.js"

class MLVTrackDialog{
    constructor(config,panel){
    
        this.config = MLVTrack.parseConfig(config);
        this.panel=panel;
        this.div = $("<div>");
        this.id=MLVTrackDialog.id++;
        
        this.div.dialog({
        autoOpen: true, 
           /* buttons: {
                OK: function() {
                    //let c = self.track_controls.getAllDetails()[0];
                    //self.update(c);
                    $(this).dialog("close");
                   
                }
            },*/
            close:function(){
                $(this).dialog('destroy').remove();
            },
        title: this.config.short_label,
        width:250
       
        });

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
                if (y>self.config.max_y){
                    self.scale_slider.slider("option","max",y);
                }
                self.scale_slider.slider("option","values",[self.config.min_y,y]);
                self.config.max_y=y;
                self._updatePanelScale();

                
            }).appendTo(scale_div).width(40).css({"float":"right"}).val(self.config.max_y);


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
            this.div.append("<hr>");
            let discrete_div=$("<div>").append("<label>Discrete</label>");
            let check = $("<input>").attr({type:"checkbox"}).prop("checked",this.config.discrete)
                .click(function(e){
                    self.config.discrete=$(this).prop("checked");
                    if (self.panel){
                        self.panel.setTrackAttribute(self.config.track_id,"discrete",self.config.discrete);
                        self.panel.update();
                    }
                });
            discrete_div.append(check).append("<br>").append("<label>height:</label>").appendTo(this.div);

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
            height_slider.appendTo(discrete_div);
            discrete_div.append("<label>group:</label>").append("<br>");
            let input= $("<input>").on("blur keypress",function(e){
                 if (e.type==="keypress" && !(e.which===13)){
                    return;
                }
                self.config.group=$(this).val();
                self.panel.setTrackAttribute(self.config.track_id,"group",self.config.group);
                self.panel.update();

            });
            input.val(this.config.group).appendTo(discrete_div);
              







     this.div.append("<hr>");
    
        }
       

       

    if (this.config.format==="feature"){

    let feature_div=  $("<div>").append("<label>Height</label><br>");
    self.feature_height_slider=$("<div>").slider({
       max:40,
       min:5,
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
  

   let p = this.div.parent();
    p.find(".ui-dialog-content").css("font-size","12px");
    p.find(".ui-dialog-title").css("font-size","12px");
    p.find(".ui-dialog-titlebar").css("padding",".2em 1em");
    //p.find(".t-d-div").css("margin","3px 0px");
    p.find("label").css({"font-weight":"600","margin-right":"3px","margin-top":"4px"});
    //p.find("div").css("margin","3px");

        	
    }

    
       


       
}

MLVTrackDialog.id=0;

export {MLVTrackDialog};