import {MLVTrackDialog} from "./track_dialog.js";

class PanelLegend{
    constructor(panel){
        this.panel=panel;
        this.track_index={};
        this.div=$("<div>").css({"position":"absolute","top":"0px","left":"0px","border":"0.5px solid black","background-color":"white"});
        this.li =$("<ul>").css({"list-style-type":"none","padding":"4px","margin":"4px"});
        for (let id of panel.track_order){
           this.addTrack(panel.tracks[id].config);
        }
        let self = this;
        this.div.append(this.li);
        this.li.sortable({
            stop:function(e,ui){
            	self._reOrder(ui.item);
         
            }
        });
      
        panel.trackDiv.append(this.div);
        
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
           else{
               el.text(track.short_label);
           }
        });                  
    }
    
    addTrack(track){
        let self = this;
        let item = $("<li>").data({track:track,panel:this.panel}).click(function(e){
            new MLVTrackDialog(track,self.panel);
        });
        let span = $("<span>").width(15).height(15).css({"display":"inline-block","margin-right":"3px"});
        let icon= "fas fa-signature"
        if (track.format==="feature"){
            icon = "fas fa-stream"
        }
        else if (track.format==="ruler"){
            icon="fas fa-ruler-horizontal";
        }

        span.attr("class",icon).css("color",track.color)
        /*if (track.format==='line'){
            span.height(2);
        }
        if (track.display==="line"){
            span.height(4)
        }
        */
        let text = $("<span>");//.text(track.short_label)
        item.append(span).append(text);
        this.li.append(item); 
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