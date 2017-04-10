//leaflet config
var map = new L.map('mapid', {center: new L.LatLng(37.770, -122.491), zoom: 17, dragging:false}); //editable:true}); //for editing

var osmURL = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'
var osmAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
var osm = L.tileLayer(osmURL, {attribution: osmAttr, maxZoom: 18, id: 'mapbox.satellite',
	accessToken: 'pk.eyJ1IjoiYmlsbHliYWJpcyIsImEiOiJjaXl5cHc0MnMwMGx2MzJvcXQ0dnQ0eWNzIn0.tUwNAvAaptzw-VHu65Ghww'
});
osm.addTo(map);

//To add or change classifications, change the following two dictionaries
var classifsShapes_dict = {"Trees":[],"Bushes":[],"Grass":[]};
var colors = {"Trees":'green',"Bushes":'red',"Grass":'orange'};
var currClassif = "Trees";
var currClassifShapes = classifsShapes_dict[currClassif];
//for drawing new shapes
var currShape = [];
var prevLtLg;
var drawing = false;  //true if mouse is pressed down and drawing
map.dragging.enable();
var drawCursor = false; //true when the draw cursor is selected, rather than map mover (toggleBtn below)
var currLines = []; // for deleting sub-polylines
//var editing=false; // for editing

//for cursor -> drawing or moving map around
var toggleBtnCtrl = "control";
var toggleBtns = L.easyButton({ 
  states: [{
    stateName: 'draw',
    icon: 'glyphicon-pencil',
    title: 'Draw to highlight regions',
    onClick: function(control) {
      toggleBtnCtrl = control;
      document.getElementById("bodyID").style.cursor = "default";
      map.dragging.disable();
      drawCursor=true;
      cursorChange();
      control.state('move-map');
      //editing = false; // for editing
    }
  }, {
    icon: 'glyphicon-move',
    stateName: 'move-map',
    title: 'Move the map',
    onClick: function(control) {
    	toggleBtnCtrl = control;
    	map.dragging.enable();
    	drawCursor=false;
    	cursorChange();
      	control.state('draw');
    },
  }]
});
toggleBtns.addTo(map);

//drawing functions
function initiateDraw(e) {
	prevLtLg=e.latlng;
	drawing = true;
	currShape = [e.latlng];
}
function brushStrokes(e) {
	if (drawing) {
		var currColor = colors[currClassif];
		var line = L.polyline([prevLtLg,e.latlng],{color:currColor}).addTo(map);
		currLines.push(line); 
		prevLtLg=e.latlng;
		currShape.push(e.latlng); //can add every 2 or 3 to minimize GeoJSON coordinates
	}
}
function endDraw(e) {
	if (drawing==true) {
		currShape.push(e.latlng);
		drawing=false;
		if (currShape.length>5) {  //to avoid creating a shape when clicking buttons (technical debt)
			var currColor = colors[currClassif];
			var newShape = L.polygon(currShape,{color:currColor}).addTo(map);
			currClassifShapes.push(newShape);
			classifsShapes_dict[currClassif]=currClassifShapes;
		}
		//delete sub-polylines under polygon
		for (var line in currLines){
			currLines[line].remove();
		}
		currLines = [];  // for editing
		currShape = [];
		console.log(currClassifShapes);
	}
}
function cursorChange(){
	if (drawCursor==true) {
		map.on("mousedown", initiateDraw);
		map.on("mousemove", brushStrokes);
		map.on("mouseup", endDraw);
	} else {
		map.removeEventListener("mousedown",initiateDraw);
		map.removeEventListener("mousemove",brushStrokes);
		map.removeEventListener("mouseup",endDraw);
	}
}

//for deleting
/*
L.easyButton('glyphicon-trash', function(btn, map){
	//make sure draking is disabled.
	toggleBtnCtrl.state("draw");
	map.dragging.enable();
    drawCursor=false;
    cursorChange();
    //set delete listener to each shape
    for (var classif in classifsShapes_dict ) {
		var shapes = classifsShapes_dict[classif];
		if (shapes.length>0){
			for (var i in shapes) {
				var shape = shapes[i];
				shape.on("click", function(e, i) {
					console.log(e);
					shape.remove();
					shapes.splice(i,1);
					classifsShapes_dict[classif]=shapes;
				});
			}
		}
	}
}).addTo( map ); */

/* for editing
L.easyButton('glyphicon-erase', function(btn, map){
	if (editing==false) {
		for (var i in currClassifShapes) {
			currClassifShapes[i].enableEdit();
			map.dragging.enable();
	    	drawCursor=false;
	    	cursorChange();
			toggleBtnCtrl.state('draw');
		}
	}
	else {
		for (var i in currClassifShapes) {
			currClassifShapes[i].disableEdit();
		}
	}
}).addTo(map);
*/ 

//change classification settings when dropdown menu changes value
var classifs = document.getElementById("dropdown_classifs");
classifs.addEventListener("change", function(e) {
	//update classifsShape Dictionary
	classifsShapes_dict[currClassif] = currClassifShapes;
	//update curr shape info
	currClassif = e.target.value;
	currClassifShapes = classifsShapes_dict[currClassif];
	currShape = [];
});

//this should is the submit button response -> for now, just presents a modal with data
function show() {
	console.log(classifsShapes_dict);
	var pTag = document.getElementById("showGeoJsons");
	pTag.innerHTML = "<br> GeoJSON's for highlighted regions: " + "<br><br>"
	for (var classif in classifsShapes_dict ) {
		var shapes = classifsShapes_dict[classif];
		pTag.innerHTML += "<br> <b>" + classif + "</b><br>"
		for (var i in shapes) {
			pTag.innerHTML += "New Shape: "
			pTag.innerHTML += JSON.stringify(shapes[i].toGeoJSON() ) + "<br>";
		}
	}
}

//Add shape file
L.Control.FileLayerLoad.LABEL = '<img class="icon" src="folder.svg" alt="file icon"/>';
L.Control.fileLayerLoad({
    fitBounds: true,
	layerOptions: {style: {color:'blue',opacity: 1.0,fillOpacity:0,clickable:false}}
}).addTo(map);

//Add legen with colors of classifications 
var legend = L.control({position: 'bottomright'});
legend.onAdd = function (map) {
	var div = L.DomUtil.create('div', 'legend');
	for (var classif in classifsShapes_dict){
		div.innerHTML +=
		'<i style="background:' + colors[classif] + '"></i> ' +
		classif + '<br>';
	}
	return div;
};
legend.addTo(map);



/* OMNIVMORE UPLOAD  - another shapefile upload option
document.getElementById('shapeFile').addEventListener('change', function(){
    var file = this.files[0];
    //L.geoJson(file).addTo(map);
    var objectURL = window.URL.createObjectURL(file);
   	var boundary = omnivore.geojson(objectURL);
   	map.setView(boundary);
});
//omnivore.geojson('https://raw.githubusercontent.com/mapbox/leaflet-omnivore/master/test/a.geojson').addTo(map);
					<span class="btn btn-default btn-file">
					    Upload Shape File <input id="shapeFile" type="file">
					</span>
<script src='https://api.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.2.0/leaflet-omnivore.min.js'></script>
		<!--script src='https://api.mapbox.com/mapbox.js/plugins/leaflet-omnivore/v0.2.0/leaflet-omnivore.min.js'></script-->
<!--Leaflet.FileLayer-master/src/leaflet.filelayer.js'></script-->
*/