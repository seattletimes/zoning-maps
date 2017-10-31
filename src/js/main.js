// require("./lib/social");
// require("./lib/ads");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
require("component-leaflet-map");
require("leaflet.heat");

var $ = require("./lib/qsa");
var colors = require("./lib/colors");
var xhr = require("./lib/xhr");

var points = window.heatData.map(h => [h.lat, h.lng, h.black]);

var mapElement = $.one("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;

var heatLayer = L.heatLayer([], {
  radius: 15,
  blur: 10,
  maxZoom: 18,
  gradient: { 0: colors.rgba(0, 0, 255, .5), 1: colors.palette.stDarkOrange },
  max: 5.0
});
heatLayer.addTo(map);

map.on("click", e => console.log(e.latlng));

map.fitBounds([[47.525, -122.4], [47.725, -122.2]]);

var avgElement = $.one(".average");
var demoLabel = $.one(".demo-label");

var onFilter = function() {
  $(".set-demo.active").forEach(el => el.classList.remove("active"));
  this.classList.add("active");
  var demo = this.getAttribute("data-demo");
  demoLabel.innerHTML = demo[0].toUpperCase() + demo.slice(1);
  var points = window.heatData.map(h => [h.lat, h.lng, h[demo]]);
  var average = points.reduce((t, n) => t + n[2], 0) / points.length;
  // avgElement.innerHTML = average.toFixed(1) + "+";
  heatLayer.setLatLngs(points);
  heatLayer.setOptions({
    max: average
  });
};

$(".set-demo").forEach(el => el.addEventListener("click", onFilter));
onFilter.call($.one(`[data-demo="black"]`));

xhr("./assets/multifamily.geojson", function(err, data) {
  var pane = map.createPane("shapefiles");
  pane.style.pointerEvents = "none";
  var layer = new L.GeoJSON(data, {
    style: feature => ({
      color: colors.palette.dfOffBlack,
      fillColor: colors.palette.dfOffBlack,
      opacity: .5,
      fillOpacity: .1,
      weight: 2
    }),
    pane: "shapefiles"
  });
  layer.addTo(map);
  // map.fitBounds(layer.getBounds());
});

window.map = map;