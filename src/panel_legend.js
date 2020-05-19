import {MLVTrackDialog} from "./track_dialog.js";

class PanelLegend{
    constructor(panel,config){
        if (!config){
            config={};
        }

        this.panel=panel;
        this.track_index={};
        this.div=$("<div>").attr({"class":"mlv-track-legend"})
        .mousedown(function(e){
            e.stopPropagation();
        })

        if (config.draggable || config.draggable=== undefined){
          this.div.draggable({
            containment:"parent"
         })
        }

         if (config.transparent == false || config.transparent===undefined){
             this.div.css("background-color","white")
         }
    
        this.li =$("<ul>").css({"list-style-type":"none","padding":"4px","margin":"4px"});
        for (let id of panel.track_order){
           this.addTrack(panel.tracks[id].config);
        }
        let self = this;
        this.div.append(this.li);
        this.li.sortable({
            helper:"clone",
            stop:function(e,ui){
            	self._reOrder(ui.item);
         
            }
        });
      
      
        panel.trackDiv.append(this.div);
        
    }

    swapOrder(id1,id2){
        let el1=null;
        let el2=null;
           this.li.children().each(function(i,el){
            let e = $(el);
            let track =  e.data("track");
           
            if (track.track_id===id2){
                el2=e;        
            }
            else if  (track.track_id===id1){
                el1=e
            }
       

        });

        el1.detach();
        el1.insertAfter(el2);

    }

    _reOrder(item){
        let group = item.data("track").group;
        let item_id=item.data("track").track_id;
        let order=[];
        let group_index=0;
        let other_group_members=[]
        this.li.children().each(function(i,el){
            let track =  $(el).data("track");
            if (group && track.group ===group){
                if (track.track_id===item_id){
                    group_index=order.length;
                    order.push(track.track_id)
                }
                else{
                    other_group_members.push(track.track_id)
                }
                return;
            }
            order.push(track.track_id);

        });
     
        for(let tid of other_group_members){
           order.splice(group_index+1,0,tid);
           group_index++;
           this.track_index[tid].detach().insertAfter(item);
           item =  this.track_index[tid];

        }
        this.panel.track_order=order;
       
        this.panel.update();
    }

    updateTrack(track_id){
       let element = this.track_index[track_id];
       let track = element.data("track");
       element.children().each(function(index,el){
    	   el=$(el);
           if (index==0){
        	   el.css("color",track.color);  	   
           }
           else if (index==1){
               el.text( track.short_label);
           }
        });
        this.li.width(null);                  
    }
    
    addTrack(track,index){
        let self = this;
        let item = $("<li>").data({track:track,panel:this.panel})
        .click(function(e){
            new MLVTrackDialog(track,self.panel);
        });
        let span = $("<span>");
        let icon= "fas fa-signature"
        if (track.format==="feature"){
            icon = "fas fa-stream"
        }
        else if (track.format==="ruler"){
            icon="fas fa-ruler-horizontal";
        }

        span.attr("class",icon).css({"color":track.color})
        /*if (track.format==='line'){
            span.height(2);
        }
        if (track.display==="line"){
            span.height(4)
        }
        */
        let text = $("<span>").attr("class","mlv-track-legend-text");
        item.append(span).append(text);
        let t_sp = $("<span>").width(15).appendTo(item);
        if (track.allow_user_remove){
            let rm=$("<i class='fas  fa-trash'></i>").click(function(e){
                self.panel.removeTrack(track.track_id);
                self.removeTrack(track.track_id);
            })
            .css("float","right")
            .appendTo(t_sp);
        }
        if (index===0){
            this.li.prepend(item);
        }
        else if (index){
            let pos_el=this.li.children()[index-1]
            item.insertAfter($(pos_el));
        }
        else{
            this.li.append(item);
        }
        this.track_index[track.track_id]=item;
        this.updateTrack(track.track_id);   
    }
    
    removeTrack(track_id){
        this.li.children().each(function(index,element){
            element = $(element);
            let t =  element.data("track");
            if (t && t.track_id===track_id){
                element.remove();
            }
        });
        delete this.track_index[track_id];
    }

    hide(){
        this.div.hide();
    }
}


export {PanelLegend};