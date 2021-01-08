// This isn't necessary but it keeps the editor from thinking L and carto are typos
/* global L, carto, EXIF */

var grayscale = L.tileLayer('https://api.mapbox.com/styles/v1/stoopkid/cjtovn91s6in91fo1mdez0l0y/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic3Rvb3BraWQiLCJhIjoiY2pkcGFhdnFxMGMyZDJ5bzNzNDBnNnhheSJ9.hX4mpG7NWNi_cL4KVLt2aw'),
    streets   = L.tileLayer('https://api.mapbox.com/styles/v1/stoopkid/cjnmnwdvm1e2q2smrz9ark97p/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoic3Rvb3BraWQiLCJhIjoiY2pkcGFhdnFxMGMyZDJ5bzNzNDBnNnhheSJ9.hX4mpG7NWNi_cL4KVLt2aw');

var map = L.map('map', {
    center: [23.129802,-82.335393],
    zoom: 20,
    //wyy does my map crash after 18?
    maxZoom: 18,

    layers: [grayscale]
});

var baseMaps = {
    "<span style='color: gray'>Grayscale</span>": grayscale,
    "Streets": streets
};

// controls placeholders!!! just to move zoom and others around
function addControlPlaceholders(map) {
    var corners = map._controlCorners,
        l = 'leaflet-',
        container = map._controlContainer;

    function createCorner(vSide, hSide) {
        var className = l + vSide + ' ' + l + hSide;

        corners[vSide + hSide] = L.DomUtil.create('div', className, container);
    }

    createCorner('verticalcenter', 'left');
    createCorner('verticalcenter', 'right');
}
addControlPlaceholders(map);

// Change the position of the Zoom Control to a newly created placeholder.
map.zoomControl.setPosition('verticalcenterright');

// You can also put other controls in the same placeholder.
L.control.scale({position: 'verticalcenterright'}).addTo(map);
// END controls placeholders!!! just to move zoom and others around


L.control.layers(baseMaps).addTo(map);

map.on('baselayerchange', function (e) {e.layer.bringToBack()})


// Initialize Carto
var client = new carto.Client({
  apiKey: 'a09a51a69ba0a19d0af3f7f6b5916e886a6392b4',
  username: 'redcross-sims'
});

// Initialze source data
var source = new carto.source.SQL('SELECT * FROM finalcat');


// Create style ]
var style = new carto.style.CartoCSS(`
  #layer {
  polygon-fill:white;
  opacity: 0.7;
}
`);

// Add style to the data
var layer = new carto.layer.Layer(source, style);
client.addLayer(layer);
client.getLeafletLayer().addTo(map);


var IncidentStyle = new carto.style.CartoCSS (`
#layer {
}
`);

var ClickStyle = new carto.style.CartoCSS(`
#layer {
  polygon-fill: #879ceb;

[type = 'mamposteria_h'] {
	polygon-fill: #eb879c;
}

[type = 'contemporary'] {
	polygon-fill: #87ceeb;
}

[type = 'other'] {
	polygon-fill: #879ceb;
}

[type = 'moderne'] {
	polygon-fill: #ceeb87;
}

[type = 'wood_h'] {
	polygon-fill: #ebd687;
}

}
`);


var ClickLayer = new carto.layer.Layer(source, ClickStyle, {
  featureClickColumns: ['name', 'type', 'media', 'thumbnail','thumbnail_l', 'thumbnail_r','n_address', 'street']
});

var popup = L.popup ();
ClickLayer.on('featureClicked', function (event) {
  console.log('click');
  var content = '<div class="row">'+ '<div class="column" style="position: relative" >' +"<a href='" + event.data['thumbnail_l'] +"' target=\"_blank\">"+ "<img class='resize2' src='" + event.data['thumbnail_l'] +"' height= 100% width= 100% </img></a>" + '</div>';
  // var content = '<h3 class="paragraphText2">' + 'Type of Architecture' + '</h3>'+ "<h3 class='paragraphText'>" + '&nbsp'+ event.data ['type'] + '<br>'  + '</h3>';
  content += '<div  class=" column" style=" position:relative; ">' + "<a href='" + event.data['media'] +"' target=\"_blank\">"+"<img  src='" + event.data['thumbnail'] +"' height= 100% width= 100% </img>" + "<h3 class='paragraphText3 !imporatnt'>" + event.data ['street'] +'&nbsp#' +  event.data ['n_address'] + '</h3>'+ '</a>' + '</div>';
  content += '<div class=" column" style="position: relative;">' +"<a href='" + event.data['thumbnail_r'] +"' target=\"_blank\">"+"<img class='resize1' src='" + event.data['thumbnail_r'] +"' height= 100% width= 100% </img></a>" + '</div>' + '</div>';
  // content += "<b>Image: </b><a href='" + "' target=\"_blank\">"+"<img src='"+ event.data['media'] + "&previewImage=true'</img></a>";
  // content += '<br>' + '<a href="' + event.data['media'] + '" target="_blank">As reported by' + '&nbsp' + event.data['bi_restored'] + '.' + '</a>';
    // content += '<h3 class="paragraphText !imporatnt">' + 'Address' + '</h3>'+ '&nbsp'+ event.data ['name'];
  // content += '<br>' + '<a href="./about.html#work" target="_blank">Learn more about' + '&nbsp' + event.data['type'] + '.' + '</a>';


  console.log(content);
  popup.setContent(content)
  popup.setLatLng(event.latLng)
  popup.openOn(map);
});

client.addLayers([ClickLayer]);
client.getLeafletLayer().addTo(map);


// dropdown

var layerPicker = document.querySelector('.layer-picker');
// Step 2: Add an event listener to the dropdown. We will run some code whenever the dropdown changes.
layerPicker.addEventListener('change', function (e) {
  // The value of the dropdown is in e.target.value when it changes
  var type = e.target.value;
  // Step 3: Decide on the SQL query to use and set it on the datasource
  if (type === 'all') {
    // If the value is "all" then we show all of the features, unfiltered
    source.setQuery("SELECT * FROM finalcat");
  }
  else {
    // Else the value must be set to a type level. Use it in an SQL query that will filter to that type level.
    source.setQuery("SELECT * FROM finalcat WHERE external_layer = '" + type + "'");
  }
  // Sometimes it helps to log messages, here we log the p-level. You can see this if you open developer tools and look at the console.
  console.log('Dropdown changed to "' + type + '"');
});


//  // SCRIPT FOR POINTS FILTER CHECK BUTTONS
// function handleCheckboxChange() {
//   var residentialCheckbox = document.querySelector('.residential-checkbox');
//   var residentialType = [];
//   if (residentialCheckbox.checked) {
//     residentialType.push("'yes'");
//   }
//   if (residentialType.length) {
//     var sql = "SELECT * FROM finalcat WHERE bi_residencial IN (" + residentialType.join(',') + ")";
//     console.log(sql);
//     source.setQuery(sql);
//   }
//   else {
//     source.setQuery("SELECT * FROM finalcat");
//   }
// }
//
// //commercial
// function handleCheckboxChange2() {
//   var otherCheckbox = document.querySelector('.Other-checkbox');
//
//   var commercialType = [];
//   if (otherCheckbox.checked) {
//     commercialType.push("'yes'");
//   }
//   if (commercialType.length) {
//     var sql = "SELECT * FROM finalcat WHERE bi_commerce IN (" + commercialType.join(',') + ")";
//     console.log(sql);
//     source.setQuery(sql);
//   }
//   else {
//     source.setQuery("SELECT * FROM finalcat");
//   }
// }
//
// // mixed use
// function handleCheckboxChange3() {
//   var mixedCheckbox = document.querySelector('.mixed-checkbox');
//
//   var mixedType = [];
//     if (mixedCheckbox.checked) {
//     mixedType.push("'yes'");
//   }
//
//   if (mixedType.length) {
//     var sql = "SELECT * FROM finalcat WHERE mixed_use IN (" + mixedType.join(',') + ")";
//     console.log(sql);
//     source.setQuery(sql);
//   }
//   else {
//     source.setQuery("SELECT * FROM finalcat");
//   }
// }
//
// //Barbacoa
// function handleCheckboxChange4() {
//   var barbacoaCheckbox = document.querySelector('.barbacoa-checkbox');
//
//   var barbacoaType = [];
//   if (barbacoaCheckbox.checked) {
//     barbacoaType.push("'yes'");
//   }
//   if (barbacoaType.length) {
//     var sql = "SELECT * FROM finalcat WHERE bi_barbacoa IN (" + barbacoaType.join(',') + ")";
//     console.log(sql);
//     source.setQuery(sql);
//   }
//   else {
//     source.setQuery("SELECT * FROM finalcat");
//   }
// }
//
//
// /*
//  * Listen for changes on any checkbox
//  */
// var residentialCheckbox = document.querySelector('.residential-checkbox');
// residentialCheckbox.addEventListener('change', function () {
//   handleCheckboxChange();
// });
// var mixedCheckbox = document.querySelector('.mixed-checkbox');
// mixedCheckbox.addEventListener('change', function () {
//   handleCheckboxChange3();
// });
// var otherCheckbox = document.querySelector('.Other-checkbox');
// otherCheckbox.addEventListener('change', function () {
//   handleCheckboxChange2();
// });
// var barbacoaCheckbox = document.querySelector('.barbacoa-checkbox');
// barbacoaCheckbox.addEventListener('change', function () {
//   handleCheckboxChange4();
// });



// SCRIPT FOR POINTS FILTER CHECK BUTTONS
function handleCheckboxChange() {
 var woodCheckbox = document.querySelector('.wood-checkbox');
 var otherCheckbox = document.querySelector('.Other-checkbox');
 var mixedCheckbox = document.querySelector('.mixed-checkbox');
 var adicionCheckbox = document.querySelector('.adicion-checkbox');
 var modernCheckbox = document.querySelector('.modern-checkbox');
 var barbacoaCheckbox = document.querySelector('.barbacoa-checkbox');


 var archType = [];
 var barbacoa = [];

 if (woodCheckbox.checked) {
   archType.push("'wood_h'");
 }
   if (otherCheckbox.checked) {
    archType.push("'mamposteria_h'");
   }
   if (mixedCheckbox.checked) {
     archType.push("'contemporary'");
 }
 if (modernCheckbox.checked) {
   archType.push("'moderne'");
 }
 if (adicionCheckbox.checked) {
   archType.push("'other'");
 }
 if (archType.length || barbacoa.length) {
   var sql = "SELECT * FROM finalcat WHERE (type) IN (" + archType.join(',') + ")";
   // var sql = "SELECT * FROM finalcat WHERE (type) IN (" + archType.join(',') + ")  INTERSECT SELECT * FROM finalcat WHERE (bi_barbacoa) IN (" + barbacoa.join(',') + ") ";
   console.log(sql);
   source.setQuery(sql);
 }
 else {
   source.setQuery("SELECT * FROM finalcat");
 }
}

/*
* Listen for changes on any checkbox
*/
var woodCheckbox = document.querySelector('.wood-checkbox');
woodCheckbox.addEventListener('change', function () {
 handleCheckboxChange();
});
var mixedCheckbox = document.querySelector('.mixed-checkbox');
mixedCheckbox.addEventListener('change', function () {
 handleCheckboxChange();
});
var otherCheckbox = document.querySelector('.Other-checkbox');
otherCheckbox.addEventListener('change', function () {
 handleCheckboxChange();
});
var adicionCheckbox = document.querySelector('.adicion-checkbox');
adicionCheckbox.addEventListener('change', function () {
 handleCheckboxChange();
});
var modernCheckbox = document.querySelector('.modern-checkbox');
modernCheckbox.addEventListener('change', function () {
 handleCheckboxChange();
});



document.getElementById('resilience_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat WHERE resilient IN ('yes')";
  console.log(sql2);
  source.setQuery(sql2);
});

document.getElementById('preserved_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat WHERE resilient IN ('no')";
  console.log(sql2);
  source.setQuery(sql2);
});

document.getElementById('barbacoa_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat WHERE bi_barbacoa IN ('yes')";
  console.log(sql2);
  source.setQuery(sql2);
});

document.getElementById('commerce_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat WHERE bi_commerce IN ('yes')";
  console.log(sql2);
  source.setQuery(sql2);
});

document.getElementById('floors_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat WHERE add_floor IN ('yes')";
  // var sql2 = "SELECT * FROM finalcat WHERE n_floors >= 2";
  console.log(sql2);
  source.setQuery(sql2);
});
document.getElementById('reset_button').addEventListener('click', function () {
  var sql2 = "SELECT * FROM finalcat";
  // var sql2 = "SELECT * FROM finalcat WHERE n_floors >= 2";
  console.log(sql2);
  source.setQuery(sql2);
});
