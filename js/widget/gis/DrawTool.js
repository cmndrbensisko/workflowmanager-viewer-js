define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    
    "dijit/form/Button",
    "dojo/_base/lang",
    "dojo/_base/Color",
    "dojo/_base/connect",
    "dojo/on",
    "dojo/dom-style",
    "dojo/_base/array",
    "dojo/topic",
	"esri/InfoTemplate",
	"dojo/dom-construct",

    "dojo/i18n!./DrawTool/nls/Strings",
    
    "esri/toolbars/draw",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "dojo/text!./DrawTool/templates/DrawTool.html",
    "app/WorkflowManager/config/Topics",
	"app/WorkflowManager/config/AppConfig"
], 

function(
    declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, 
    Button, lang, Color, connect, on, domStyle, arrayUtil, topic, InfoTemplate, domConstruct,
    i18n,
    Draw, Graphic, GraphicsLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, drawTemplate, appTopics, appConfig) {

    //anonymous function to load CSS files required for this module
    (function() {
        var css = [require.toUrl("./js/widget/gis/DrawTool/css/DrawTool.css")];
        var head = document.getElementsByTagName("head").item(0),
            link;
        for(var i = 0, il = css.length; i < il; i++) {
            link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = css[i].toString();
            head.appendChild(link);
        }
    }());

    // main draw dijit
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        widgetsInTemplate: true,
        templateString: drawTemplate,
        toolbar: null,
        graphics: null,
		pickPolyActivated: false,
        //i18n
		i18n_Pick: i18n.pick,
        i18n_Point: i18n.point,
        i18n_Line: i18n.line,
        i18n_Polygon: i18n.polygon,
        i18n_Rectangle: i18n.rectangle,
        i18n_Lasso: i18n.lasso,
        i18n_Save: i18n.save,
        i18n_Delete: i18n.deleteAOI,
        i18n_Cancel: i18n.cancel,
        
        postCreate: function() {
            this.inherited(arguments);
            
            this.own(on(this.btnDrawPoint, "click", lang.hitch(this, this.drawPoint)));
            this.own(on(this.btnDrawLine, "click", lang.hitch(this, this.drawLine)));
            this.own(on(this.btnDrawPolygon, "click", lang.hitch(this, this.drawPolygon)));
            this.own(on(this.btnDrawRectangle, "click", lang.hitch(this, this.drawRectangle)));
            this.own(on(this.btnDrawFreehandPolygon, "click", lang.hitch(this, this.drawFreehandPolygon)));
			this.own(on(this.btnPickPolygon, "click", lang.hitch(this, this.pickPolygon)));
            this.own(on(this.btnClearAoi, "click", lang.hitch(this, this.clearAoi)));
            this.own(on(this.btnSaveGraphics, "click", lang.hitch(this, this.saveGraphics)));
            this.own(on(this.btnCancelDraw, "click", lang.hitch(this, this.cancelDraw)));
            
            domStyle.set(this.btnDrawPoint.domNode, "display", this.display(this.drawConfig.tools, "POINT"));
            domStyle.set(this.btnDrawLine.domNode, "display", this.display(this.drawConfig.tools, "POLYLINE"));
            domStyle.set(this.btnDrawPolygon.domNode, "display", this.display(this.drawConfig.tools, "POLYGON"));
            domStyle.set(this.btnDrawRectangle.domNode, "display", this.display(this.drawConfig.tools, "RECTANGLE"));
            domStyle.set(this.btnDrawFreehandPolygon.domNode, "display", this.display(this.drawConfig.tools, "FREEHAND_POLYGON"));
			domStyle.set(this.btnPickPolygon.domNode, "display", this.display(this.drawConfig.tools, "PICKPOLY"));

			on(this.map, "click", dojo.hitch(this,function(evt){
				if (this.pickPolyActivated && evt.hasOwnProperty("mapPoint")){
					var queryTask = new esri.tasks.QueryTask(appConfig.app.pickPolyLayer);
					var selectQuery = new esri.tasks.Query();
					selectQuery.spatialRelationship = esri.tasks.Query.SPATIAL_REL_INTERSECTS;
					selectQuery.returnGeometry = true;
					selectQuery.geometry = evt.mapPoint;
					queryTask.execute(selectQuery,dojo.hitch(this,function(featureSet){
						if (featureSet.features.length > 0){
							//alert(featureSet.features.length);
							this.pickPolyActivated=false;
							this.graphics.clear();
							this.map.infoWindow.setFeatures(featureSet.features);
							if (featureSet.features.length == 1){
								this.toolbarDrawEnd(featureSet.features[0].geometry);
							}else{
								this.map.infoWindow.highlight = true;
								this.map.infoWindow.pagingControls = true;
								//this.map.infoWindow.features = featureSet.features
								this.map.infoWindow.show(evt.mapPoint);
								var pickButton = domConstruct.toDom("<button>Select This Polygon</button>")
								on(this.map.infoWindow,"selection-change", lang.hitch(this,function(){
									this.map.infoWindow.setContent(pickButton);
								}));
								on(pickButton,"click", lang.hitch(this,function(){
									this.map.infoWindow.hide();
									this.toolbarDrawEnd(this.map.graphics.graphics[0].geometry);
								}));
								this.map.infoWindow.setContent(pickButton);
							}
						}else{
							alert("no features in selected area");
						}
					}))
				}
			}));
			
            this.toolbar = new Draw(this.map);
            this.graphics = new GraphicsLayer({
                id: "drawGraphics",
                title:"Draw Graphics"
            });
            this.map.addLayer(this.graphics);
            dojo.connect(this.toolbar, "onDrawEnd", this, this.toolbarDrawEnd);

            //hide save/cancel buttons
            domStyle.set(this.btnCancelDraw.domNode, "display", "none");
            domStyle.set(this.btnSaveGraphics.domNode, "display", "none");
            domStyle.set(this.btnClearAoi.domNode, "display", "none");
        },
        
        display: function(arr, value) {
            return (arrayUtil.indexOf(arr, value) >= 0) ? "block" : "none";
        },
        
        startup: function () {
            console.log("DrawTool started");
            
            //deactivate all buttons on startup
            this.btnDrawPolygon.set("disabled", true);
            this.btnDrawRectangle.set("disabled", true);
            this.btnDrawFreehandPolygon.set("disabled", true);
			this.btnPickPolygon.set("disabled", true);
            this.btnSaveGraphics.set("disabled", true);
            this.btnClearAoi.set("disabled", true);
        },
        
        drawPoint: function() {
            //this.disconnectMapClick();
            this.toolbarDrawStart();
            this.map.hideZoomSlider();
            this.toolbar.activate(Draw.POINT);
        },
        drawLine: function() {
            //this.disconnectMapClick();
            this.toolbarDrawStart();
            this.map.hideZoomSlider();
            this.toolbar.activate(Draw.POLYLINE);
        },
        drawPolygon: function() {
            //this.disconnectMapClick();
            this.toolbarDrawStart();
            this.map.hideZoomSlider();
            this.toolbar.activate(Draw.POLYGON);
        },
        drawRectangle: function () {
            //this.disconnectMapClick();
            this.toolbarDrawStart();
            this.map.hideZoomSlider();
            this.toolbar.activate(Draw.RECTANGLE);
        },
        drawFreehandPolygon: function () {
            //this.disconnectMapClick();
            this.toolbarDrawStart();
            this.map.hideZoomSlider();
            this.toolbar.activate(Draw.FREEHAND_POLYGON);
        },
		pickPolygon: function () {
            //this.disconnectMapClick();
			this.toolbarDrawStart();
			this.pickPolyActivated = true;
        },
        cancelDraw: function () {
            //ends drawing
            this.toolbarDrawEnd();
            this.clearGraphics();
        },

        disconnectMapClick: function() {
            dojo.disconnect(this.mapClickEventHandle);
            this.mapClickEventHandle = null;
        },
        connectMapClick: function() {
            if(this.mapClickEventHandle === null) {
                this.mapClickEventHandle = dojo.connect(this.map, "onClick", this.mapClickEventListener);
            }
        },
        
        //currently drawing
        toolbarDrawStart: function () {
            //display cancel button
            domStyle.set(this.btnCancelDraw.domNode, "display", "block");
            this.btnCancelDraw.set("disabled", false);

            domStyle.set(this.btnSaveGraphics.domNode, "display", "block");

            //deactivate click events on map layers
            topic.publish(appTopics.map.draw.start);
        },

        toolbarDrawEnd: function (geometry) {
            console.log(geometry);
            //if ((not overlapping) || (overlapping && this.AOIOverlapOverride)) {
                this.map.showZoomSlider();
                this.toolbar.deactivate();
                //activate feature layer click events
                topic.publish(appTopics.map.draw.end);

                //this.connectMapClick();

                var symbol;
                if (geometry) {
                    switch (geometry.type) {
                        case "point":
                            symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 0, 0]), 1), new Color([255, 0, 0, 1.0]));
                            break;
                        case "polyline":
                            symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255, 0, 0]), 1);
                            break;
                        case "polygon":
                            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.0]));
                            break;
                        case "rectangle":
                            symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.0]));
                            break;
                        default:
                    }
                    var graphic = new Graphic(geometry, symbol);

                    //add graphic to graphics layer
                    this.graphics.add(graphic);

                    //activate save btn when a graphic is added to map
                    this.btnSaveGraphics.set("disabled", false);
                }
                
                //this.btnClearGraphics.set("disabled", false);
            //} else {
            //    console.log("Can't overlap AOIs.");
            //}
        },
        
        saveGraphics: function() {
            // save the current graphic
            topic.publish(appTopics.map.draw.saveGraphics, this, { graphics: this.graphics });
        },
        
        clearAoi: function() {
            //this.graphics.clear();
            topic.publish(appTopics.map.draw.clear, this);
            this.toolbar.deactivate();
        },

        clearGraphics: function () {
            this.graphics.clear();

            //set save to disabled if no graphics are on the map
            this.btnSaveGraphics.set("disabled", true);
            domStyle.set(this.btnSaveGraphics.domNode, "display", "none");

            this.btnCancelDraw.set("disabled", true);
            domStyle.set(this.btnCancelDraw.domNode, "display", "none");
        },

        drawButtonActivation: function (aoiDefined) {
            if (this.hasAOIPermission) {
                //activate draw tools
                this.btnDrawPolygon.set("disabled", false);
                this.btnDrawRectangle.set("disabled", false);
				this.btnPickPolygon.set("disabled", false);
                this.btnDrawFreehandPolygon.set("disabled", false);

                if (aoiDefined) {
                    //also activate clear
                    this.btnClearAoi.set("disabled", false);
                    domStyle.set(this.btnClearAoi.domNode, "display", "block");
                } else {
                    //deactivate if no aoi
                    this.btnClearAoi.set("disabled", true);
                    domStyle.set(this.btnClearAoi.domNode, "display", "none");
                }
            }
        },

        drawButtonDeactivation: function () {
            //deactivate draw tools
            this.btnDrawPolygon.set("disabled", true);
            this.btnDrawRectangle.set("disabled", true);
            this.btnDrawFreehandPolygon.set("disabled", true);
			this.btnPickPolygon.set("disabled", true);
            this.btnSaveGraphics.set("disabled", true);
            this.btnClearAoi.set("disabled", true);
            domStyle.set(this.btnClearAoi.domNode, "display", "none");
        }

    });
});