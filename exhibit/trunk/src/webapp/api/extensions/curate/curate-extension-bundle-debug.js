﻿

/* change-list.js */
Exhibit.ChangeList=function(elmt,uiContext,settings){this._div=SimileAjax.jQuery(elmt);
this._uiContext=uiContext;
this._settings=settings;
uiContext.getDatabase().addListener(this);
this._initializeUI();
};
Exhibit.ChangeList._settingSpecs={submissionText:{type:"text",defaultValue:"Thanks for your submission! It has been sent to the exhibit author for approval."},placeholderText:{type:"text",defaultValue:"To begin editing this exhibit, click the 'edit' links on the exhibit items."},maxValueLength:{type:"int",defaultValue:50},trunctationString:{type:"text",defaultValue:"..."}};
Exhibit.UI.generateCreationMethods(Exhibit.ChangeList);
Exhibit.UI.registerComponent("change-list",Exhibit.ChangeList);
Exhibit.ChangeList.showSubmissionText=false;
Exhibit.ChangeList.prototype.dispose=function(){this._uiContext.getDatabase().removeListener(this);
this._div.innerHTML="";
this._div=null;
this._uiContext=null;
this._settings=null;
};
Exhibit.ChangeList.prototype.onAfterLoadingItems=function(){this._initializeUI();
};
Exhibit.ChangeList.prototype.addMockData=function(view){this._uiContext.getDatabase().addItem({label:"Gone With The Wind",type:"book",author:"Margaret Mitchell",year:"1936",availability:"available",owner:"Sarah",description:"Goin' down south"});
this._uiContext.getDatabase().editItem("White Noise","year","1990");
this._uiContext.getDatabase().editItem("White Noise","label","White Noice");
};
Exhibit.ChangeList.defaultMaxValueLength=50;
Exhibit.ChangeList.defaultTrunctationString="...";
Exhibit.ChangeList.prototype.makePlaceholder=function(){var placeHolder=SimileAjax.jQuery("<span>").addClass("placeholderMessage");
if(Exhibit.ChangeList.showSubmissionText){Exhibit.ChangeList.showSubmissionText=false;
placeHolder.text(this._settings.submissionText);
}else{placeHolder.text(this._settings.placeholderText);
}return placeHolder;
};
Exhibit.ChangeList.prototype.renderPropChange=function(prop,oldVal,newVal){var span=function(t,c,title){if(title){return SimileAjax.jQuery("<span>").text(t).addClass(c).attr("title",title);
}else{return SimileAjax.jQuery("<span>").text(t).addClass(c);
}};
var div=SimileAjax.jQuery("<div>").addClass("property-change");
var title;
var truncLength=this._settings.trunctationString.length;
if(newVal.length-truncLength>this._settings.maxValueLength){title=newVal;
newVal=newVal.slice(0,this._settings.maxValueLength-truncLength)+"...";
}if(oldVal){div.append(span(prop,"property-name")," was changed from ",span(oldVal,"old-value")," to ",span(newVal,"new-value",title));
}else{div.append(span(prop,"property-name")," was set to ",span(newVal,"new-value",title));
}return div;
};
Exhibit.ChangeList.prototype.renderItem=function(item){var labelText=item.label+" was "+item.changeType;
var div=SimileAjax.jQuery("<div>").append(SimileAjax.jQuery("<div>").text(labelText).addClass("change-label"));
for(var prop in item.vals){var v=item.vals[prop];
div.append(this.renderPropChange(prop,v.oldVal,v.newVal));
}return div;
};
Exhibit.ChangeList.prototype._initializeUI=function(){this._div.empty();
var view=this;
var changes=this._uiContext.getDatabase().collectAllChanges();
changes.sort(function(a,b){return a.label>b.label;
});
if(changes.length==0){this._div.append(this.makePlaceholder());
if(Exhibit.Submission){Exhibit.Submission.disableWidgets();
}}else{if(Exhibit.Submission){Exhibit.Submission.enableWidgets();
}changes.forEach(function(item){view._div.append(view.renderItem(item));
});
}};


/* curate-view.js */
(function(){var $=SimileAjax.jQuery;
Exhibit.CurateView=function(containerElmt,uiContext){this._div=$(containerElmt).addClass("CurateView");
this._uiContext=uiContext;
this._settings={};
this._accessors={};
this._submissions=null;
uiContext.getCollection().addListener(this);
};
Exhibit.CurateView._settingSpecs={adminURL:{type:"text",defaultValue:"admin.py"}};
Exhibit.CurateView.create=function(configuration,containerElmt,uiContext){var view=new Exhibit.CurateView(containerElmt,Exhibit.UIContext.create(configuration,uiContext));
Exhibit.SettingsUtilities.collectSettings(configuration,Exhibit.CurateView._settingSpecs,view._settings);
view._initializeUI();
return view;
};
Exhibit.CurateView.createFromDOM=function(configElmt,containerElmt,uiContext){var configuration=Exhibit.getConfigurationFromDOM(configElmt);
var view=new Exhibit.CurateView(containerElmt!=null?containerElmt:configElmt,Exhibit.UIContext.createFromDOM(configElmt,uiContext));
Exhibit.SettingsUtilities.collectSettingsFromDOM(configElmt,Exhibit.CurateView._settingSpecs,view._settings);
Exhibit.SettingsUtilities.collectSettings(configuration,Exhibit.CurateView._settingSpecs,view._settings);
view._initializeUI();
return view;
};
Exhibit.CurateView.prototype.dispose=function(){this._uiContext.getCollection().removeListener(this);
this._div.innerHTML="";
this._div=null;
this._uiContext=null;
this._settings=null;
this._accessors=null;
this._submissions=null;
};
Exhibit.CurateView.prototype.adminURL=function(){return this._settings.adminURL;
};
function toJSON(obj){return SimileAjax.JSON.toJSONString(obj);
}function button(text,callback){return $('<input type="button">').val(text).click(callback);
}function nameForProperty(prop){return exhibit.getDatabase().getProperty(prop).getLabel();
}function makeDismissalHandler(div,s){return function(){div.find(".buttonDiv").attr("disabled",true);
var answer=confirm("Are you sure you want to remove this submission? This action cannot be undone!");
if(answer){var msg={"command":"dismiss","sub_id":s.sub_id};
$.get(view.adminURL(),"message="+toJSON(msg),function(){div.remove();
});
}};
}function makeApprovalMessage(div,s){var edits=div.find(".edit").map(function(){var edit={label:$(this).attr("label"),values:{}};
$(this).find("input[property]").each(function(){var prop=$(this).attr("property");
var val=$(this).val();
edit.values[prop]=val;
});
return edit;
});
return{sub_id:s.sub_id,edits:edits};
}function makeApprovalHandler(view,div,s){return function(){toJSON(makeApprovalMessage(div,s));
};
}function makeEdit(view,div,submission,edit){var div=$("<div>").addClass("edit").attr("label",edit.label);
var title=edit.type=="modified"?"Changes to "+edit.label:"New Item ("+edit.label+")";
div.append($("<div>").addClass("header").append(title));
var table=$("<table>").appendTo(div);
edit.values.forEach(function(val){var input=$("<input>").val(val.value).attr("property",val.property);
table.append($("<tr>").addClass("value").append($("<td>").append(nameForProperty(val.property)),$("<td>").append(input),$("<td>").append($('<input type="checkbox">'))));
});
return div;
}function makeSubmission(view,div,s){var div=$("<div>").addClass("submission").attr("sub_id",s.sub_id);
if(s.comment){div.append($("<p>").text("Submittor's comment: "+s.comment));
}s.edits.forEach(function(e){div.append(makeEdit(view,div,s,e));
});
var buttonDiv=$("<div>").addClass("buttonDiv").append(button("Dismiss",makeDismissalHandler(view,div,s)),button("Approve",makeApprovalHandler(view,div,s)));
div.append(buttonDiv);
return div;
}function makeSubmissionHandler(view){return function(submissions){Exhibit.CurateView._submissions=submissions;
view._div.empty();
view._div.append($("<h1>").text("Submissions"));
submissions.forEach(function(s){view._div.append(makeSubmission(view,view._div,s));
});
};
}Exhibit.CurateView.prototype._initializeUI=function(){var submissionLink=$("head link[rel=exhibit/submissions]");
if(submissionLink.length>0){var url=submissionLink.attr("href");
$.getJSON(url,makeSubmissionHandler(this));
this._div.append($("<h1>").text("Loading..."));
}else{this._div.append($("<h1>").text("No submission link was provided!"));
}};
})();


/* item-creator.js */
Exhibit.ItemCreator=function(elmt,uiContext,settings){var db=uiContext.getDatabase();
if(elmt.nodeName.toLowerCase()=="a"){elmt.href="javascript:";
}SimileAjax.jQuery(elmt).click(function(){if(Exhibit.ItemCreator.ItemBoxPresent){return ;
}var item={type:settings.itemType};
Exhibit.ItemCreator.makeNewItemBox(uiContext,item,settings);
});
SimileAjax.jQuery(elmt).addClass("exhibit-itemCreator");
return elmt;
};
Exhibit.ItemCreator._settingSpecs={"itemType":{type:"text",defaultValue:"Item"},"automaticallySubmit":{type:"boolean",defaultValue:false},"submissionMessage":{type:"text"},"cancelButtonText":{type:"text",defaultValue:"Cancel"},"createButtonText":{type:"text",defaultValue:"Add Item"}};
Exhibit.UI.generateCreationMethods(Exhibit.ItemCreator);
Exhibit.UI.registerComponent("item-creator",Exhibit.ItemCreator);
Exhibit.ItemCreator.ItemBoxPresent=false;
Exhibit.ItemCreator.makeNewItemID=function(db,type){var typeLabel=db.getType(type).getLabel();
var seed="Untitled "+typeLabel;
var count="";
var name=seed;
while(db.containsItem(name)){count++;
name=seed+" "+count;
}return name;
};
Exhibit.ItemCreator.makeNewItemBox=function(uiContext,item,opts){Exhibit.ItemCreator.ItemBoxPresent=true;
SimileAjax.jQuery(".exhibit-itemCreator").css("color","AAA");
var db=uiContext.getDatabase();
opts=opts||{};
var box=$("<div><h1 class='exhibit-focusDialog-header' id='boxHeader'></h1><div class='exhibit-focusDialog-viewContainer' id='itemContainer'></div><div class='exhibit-focusDialog-controls'><button id='cancelButton' style='margin-right: 2em'>Cancel</button><button id='createButton' style='margin-left: 2em'>Add Item</button></div></div>");
if(opts.title){box.find("#boxHeader").text(opts.title);
}else{box.find("#boxHeader").remove();
}if(opts.cancelButtonText){box.find("#cancelButton").text(opts.cancelButtonText);
}if(opts.createButtonText){box.find("#createButton").text(opts.createButtonText);
}box.addClass("exhibit-focusDialog").addClass("exhibit-ui-protection");
box.css({top:document.body.scrollTop+100+"px",background:"#EEE repeat",paddingBottom:"0px"});
item.type=item.type||"item";
item.id=item.id||Exhibit.ItemCreator.makeNewItemID(db,item.type);
item.label=item.label||item.id;
db.addItem(item);
var itemDiv=box.find("#itemContainer").get(0);
uiContext.getLensRegistry().createEditLens(item.id,itemDiv,uiContext,{disableEditWidgets:true});
var uiCleanupFunc=function(){box.remove();
Exhibit.ItemCreator.ItemBoxPresent=false;
SimileAjax.jQuery(".exhibit-itemCreator").css("color","");
};
box.find("#cancelButton").click(function(){uiCleanupFunc();
database.removeItem(item.id);
});
box.find("#createButton").click(function(){if(opts.automaticallySubmit){box.find(".exhibit-focusDialog-controls button").attr("disabled","disabled");
var fSuccess=function(){database.fixChangesForItem(item.id);
uiCleanupFunc();
if(opts.submissionMessage){alert(opts.submissionMessage);
}};
var fError=function(xhr,textStatus,errorThrown){alert("Error saving new item to server!\n\n"+textStatus);
box.find(".exhibit-focusDialog-controls button").removeAttr("disabled");
};
Exhibit.SubmissionBackend.submitItemChanges(uiContext,item.id,fSuccess,fError);
}else{uiCleanupFunc();
}});
box.appendTo(document.body);
};


/* scraper.js */
Exhibit.Scraper=function(elmt,uiContext,settings){if(!settings.scraperInput){SimileAjax.Debug.warn("Scraper not given an input element!");
return ;
}var input=this._input=SimileAjax.jQuery("#"+settings.scraperInput);
input.val("");
input.attr("disabled",false);
var elmt=this._elmt=SimileAjax.jQuery(elmt);
this._uiContext=uiContext;
this._settings=settings;
elmt.attr("href","javascript:");
var scraper=this;
elmt.click(function(){scraper.activate();
});
};
Exhibit.Scraper._settingSpecs={"scraperInput":{type:"text"},"itemType":{type:"text",defaultValue:"item"},"inputType":{type:"text",defaultValue:"auto"},"scraperService":{type:"text",defaultValue:"http://valinor.mit.edu/sostler/scraper.cgi"}};
Exhibit.UI.generateCreationMethods(Exhibit.Scraper);
Exhibit.UI.registerComponent("scraper",Exhibit.Scraper);
Exhibit.Scraper.prototype.activate=function(){var input=this._input.val();
if(this._settings.inputType=="auto"){if(input.startsWith("http://")){this.scrapeURL(input);
}else{this.scrapeText(input);
}}else{if(this._settings.inputType=="text"){this.scrapeText(input);
}else{if(this._settings.inputType.toLowerCase()=="url"){this.scrapeURL(input);
}else{SimileAjax.Debug.warn("Unknown scraper input type "+this._settings.inputType);
}}}};
Exhibit.Scraper.prototype.disableUI=function(){this._input.attr("disabled",true);
this._elmt.removeAttr("href");
this._elmt.css("color","AAA");
this._elmt.unbind();
};
Exhibit.Scraper.prototype.enableUI=function(){var scraper=this;
this._input.attr("disabled",false);
this._elmt.attr("href","javascript:");
this._elmt.css("color","");
SimileAjax.jQuery(this._elmt).click(function(){scraper.activate();
});
};
Exhibit.Scraper.prototype.scrapeURL=function(url){this.disableUI();
var scraper=this;
var success=function(resp){var status=resp.status;
if(status=="ok"){scraper.scrapePageSource(resp.obj);
}else{if(status=="error"){alert("Error using scraper service!\n\n"+resp.obj);
}else{alert("Unknown response from scraper service:\n\n"+status);
}}scraper.enableUI();
};
this.disableUI();
SimileAjax.jQuery.ajax({url:this._settings.scraperService,dataType:"jsonp",jsonp:"callback",data:{url:url},success:success});
};
Exhibit.Scraper.prototype.scrapeText=function(text){var title=null;
var item=Exhibit.ScraperBackend.extractItemFromText(text,this._settings.itemType,this._uiContext.getDatabase());
Exhibit.ItemCreator.makeNewItemBox(this._uiContext,item);
};
Exhibit.Scraper.prototype.scrapePageSource=function(pageSource){var text=Exhibit.ScraperBackend.getTextFromPageSource(pageSource);
var title=Exhibit.ScraperBackend.getTitleFromPageSource(pageSource);
var item=Exhibit.ScraperBackend.extractItemFromText(text,this._settings.itemType,this._uiContext.getDatabase());
Exhibit.ItemCreator.makeNewItemBox(this._uiContext,item,{title:title});
};
Exhibit.ScraperBackend={};
Exhibit.ScraperBackend.getTitleFromPageSource=function(pageSource){var div=document.createElement("div");
div.innerHTML=pageSource.replace(/\s+/g," ");
var dom=SimileAjax.jQuery(div);
var title=dom.find("title").text();
return title;
};
Exhibit.ScraperBackend.getTextContents=function(node){function getStrings(n,strings){if(n.nodeType==3){strings.push(n.data);
}else{if(n.nodeType==1){for(var m=n.firstChild;
m!=null;
m=m.nextSibling){getStrings(m,strings);
}}}}var strings=[];
getStrings(node,strings);
return strings.join("");
};
Exhibit.ScraperBackend.getTextFromPageSource=function(pageSource){var div=document.createElement("div");
div.innerHTML=pageSource.replace(/\s+/g," ");
var children=div.childNodes;
for(i=0;
i<children.length;
i++){var node=children[i];
if(node.nodeName.toLowerCase()=="style"||node.nodeName.toLowerCase()=="script"){div.removeChild(node);
}}return Exhibit.ScraperBackend.getTextContents(div);
};
Exhibit.ScraperBackend.findMostCommon=function(substrings,text){var maxCount=0;
var maxSubstring=null;
function countSubstrings(str,text){str=str.toLowerCase();
var count=0;
var index=null;
while((index=text.indexOf(str,index))!=-1){count++;
index+=1;
}return count;
}for(var i=0;
i<substrings.length;
i++){var s=substrings[i];
var count=countSubstrings(s,text);
if(count>maxCount){maxCount=count;
maxSubstring=s;
}}return maxSubstring;
};
Exhibit.ScraperBackend.extractItemFromText=function(text,itemType,db){var item={type:itemType};
var typeSet=new Exhibit.Set();
typeSet.add(itemType);
var subjects=db.getSubjectsUnion(typeSet,"type");
text=text.toLowerCase();
db.getAllProperties().forEach(function(prop){var itemVals=db.getObjectsUnion(subjects,prop).toArray();
var mostCommonItemValue=Exhibit.ScraperBackend.findMostCommon(itemVals,text);
if(mostCommonItemValue){item[prop]=mostCommonItemValue;
}});
return item;
};


/* submission-backend.js */
Exhibit.SubmissionBackend={};
Exhibit.SubmissionBackend.formatChanges=function(itemChanges,submissionProperties){return itemChanges.map(function(change){var item={id:change.id,label:change.label||change.id};
SimileAjax.jQuery.each(change.vals||{},function(prop,val){prop=prop.toLowerCase();
item[prop]=val.newVal;
});
SimileAjax.jQuery.each(submissionProperties,function(prop,val){prop=prop.toLowerCase();
if(prop in item){throw"Collision between change property and submission property "+prop+": "+item[prop]+", "+val;
}else{item[prop]=val;
}});
return item;
});
};
Exhibit.SubmissionBackend.SubmissionDefaults={"gdoc":{"url":"http://valinor.mit.edu/sostler/gdocbackend.cgi",}};
Exhibit.SubmissionBackend.getOutputOptions=function(){var links=$('head link[rel="exhibit/output"]');
if(links.length==0){throw"No output link provided";
}else{if(links.length>1){SimileAjax.Debug.warn("Multiple output links provided; ignoring all but the first");
}}var opts={url:null,data:{}};
opts.url=links.attr("ex:url")||Exhibit.SubmissionBackend.SubmissionDefaults.gdoc.url;
if(links.attr("ex:spreadsheetKey")){opts.data.spreadsheetkey=links.attr("ex:spreadsheetKey");
}if(links.attr("ex:worksheetIndex")){opts.data.worksheetindex=links.attr("ex:worksheetIndex");
}else{if(links.attr("ex:worksheetName")){opts.data.worksheetname=links.attr("ex:worksheetName");
}else{opts.data.worksheetindex="0";
}}return opts;
};
Exhibit.SubmissionBackend.googleAuthSuccessWrapper=function(fSuccess){return function(resp){SimileAjax.Debug.log("wrapped");
SimileAjax.Debug.log(resp);
if(resp.session){Exhibit.Authentication.GoogleSessionToken=resp.session;
}fSuccess(resp);
};
};
Exhibit.SubmissionBackend._submitChanges=function(changes,options,fSuccess,fError){options.data.json=SimileAjax.JSON.toJSONString(changes);
if(Exhibit.Authentication.Enabled){if(Exhibit.Authentication.GoogleSessionToken){options.data.session=Exhibit.Authentication.GoogleSessionToken;
}else{if(Exhibit.Authentication.GoogleToken){options.data.token=Exhibit.Authentication.GoogleToken;
fSuccess=Exhibit.SubmissionBackend.googleAuthSuccessWrapper(fSuccess);
}else{SimileAjax.Debug.warn("Authentication is enabled, but no tokens are present");
}}}$.ajax({url:options.url,data:options.data,dataType:"jsonp",jsonp:"callback",success:fSuccess,error:fError});
};
Exhibit.SubmissionBackend.submitAllChanges=function(uiContext,fSuccess,fError){var opts=Exhibit.SubmissionBackend.getOutputOptions();
var changes=uiContext.getDatabase().collectAllChanges();
var formattedChanges=Exhibit.SubmissionBackend.formatChanges(changes,Exhibit.Submission.Properties);
Exhibit.SubmissionBackend._submitChanges(formattedChanges,opts,fSuccess,fError);
};
Exhibit.SubmissionBackend.submitItemChanges=function(uiContext,itemID,fSuccess,fError){var opts=Exhibit.SubmissionBackend.getOutputOptions();
var changes=uiContext.getDatabase().collectChangesForItem(itemID);
var formattedChanges=Exhibit.SubmissionBackend.formatChanges([changes],Exhibit.Submission.Properties);
Exhibit.SubmissionBackend._submitChanges(formattedChanges,opts,fSuccess,fError);
};


/* submission-widgets.js */
Exhibit.Submission={};
Exhibit.Submission.submissionWidgets=["submission-property","submission-button"];
Exhibit.Submission.enableWidgets=function(){Exhibit.UI.findAttribute("ex:role",Exhibit.Submission.submissionWidgets).removeAttr("disabled");
};
Exhibit.Submission.disableWidgets=function(){Exhibit.UI.findAttribute("ex:role",Exhibit.Submission.submissionWidgets).attr("disabled",true);
};
Exhibit.Submission.resetAfterSubmission=function(uiContext){Exhibit.UI.findAttribute("ex:role","submission-property").val("");
Exhibit.Submission.Properties={};
uiContext.getDatabase().fixAllChanges();
Exhibit.Submission.enableWidgets();
Exhibit.ChangeList.showSubmissionText=true;
uiContext.getDatabase()._listeners.fire("onAfterLoadingItems",[]);
};
Exhibit.Submission.Properties={};
Exhibit.SubmissionProperty=function(elmt,uiContext,settings){elmt.value="";
if(!settings.propertyName){SimileAjax.Debug.warn("No propertyName given for SubmissionProperty");
}else{SimileAjax.jQuery(elmt).change(function(){Exhibit.Submission.Properties[settings.propertyName]=elmt.value;
});
}};
Exhibit.SubmissionProperty._settingSpecs={propertyName:{type:"text"}};
Exhibit.UI.generateCreationMethods(Exhibit.SubmissionProperty);
Exhibit.UI.registerComponent("submission-property",Exhibit.SubmissionProperty);
Exhibit.SubmissionButton=function(elmt,uiContext,settings){var f=function(){Exhibit.Submission.disableWidgets();
var fSuccess=function(){alert("Changes successfully made!");
Exhibit.Submission.resetAfterSubmission(uiContext);
};
var fError=function(){alert("Error submitting data!");
Exhibit.Submission.enableWidgets();
};
Exhibit.SubmissionBackend.submitAllChanges(uiContext,fSuccess,fError);
};
SimileAjax.jQuery(elmt).click(f);
};
Exhibit.SubmissionButton._settingSpecs={};
Exhibit.UI.generateCreationMethods(Exhibit.SubmissionButton);
Exhibit.UI.registerComponent("submission-button",Exhibit.SubmissionButton);