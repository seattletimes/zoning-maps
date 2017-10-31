require("component-responsive-frame/child");
require("component-leaflet-map");

var xhr = require("./lib/xhr");
var $ = require("./lib/qsa");
var colors = require("./lib/colors");
var m = require("./lib/dom");

var mapElement = $.one("leaflet-map");
var map = mapElement.map;
var L = mapElement.leaflet;

var hoods = {};
window.neighborhoodData.forEach(function(row) {
  if (!hoods[row.neighborhood]) hoods[row.neighborhood] = {};
  var h = hoods[row.neighborhood];
  h[row.race] = row;
});
var whites = 0;
var total = 0;
var lowestWhiteness = Infinity;
var highestWhiteness = -Infinity;
for (var h in hoods) {
  var hood = hoods[h];
  total += hood.total.population;
  whites += hood.white.population;
  hood.whiteness = hood.white.population / hood.total.population;
  if (hood.whiteness < lowestWhiteness) lowestWhiteness = hood.whiteness;
  if (hood.whiteness > highestWhiteness) highestWhiteness = hood.whiteness;
}
var average = whites / total;

var lerp = function(a, b, d) {
  var out = [];
  for (var i = 0; i < a.length; i++) {
    out[i] = (a[i] + (b[i] - a[i]) * d) | 0;
  }
  return out;
};

var commafy = n => (n.toLocaleString()).replace(/\.0+$/, "");

xhr("./assets/cra.geojson", function(err, data) {
  var barContainer = $.one(".bar-container");
  var barHead = $.one(".neighborhood-label");
  var singleBar = $.one(".single-family.bar");
  var multiBar = $.one(".multi-family.bar");
  var tooltip = $.one(".tooltip");

  var selectedHood = null;

  var onClick = function(e) {
    barContainer.classList.remove("empty");
    singleBar.innerHTML = "";
    multiBar.innerHTML = "";
    var hood = e.target.data;
    selectedHood = hood;
    barHead.innerHTML = e.target.feature.properties.neighborhood;

    var demos = [
      { label: "Asian", key: "asian" },
      { label: "Black", key: "black" },
      { label: "Hispanic", key: "hispanic" },
      { label: "Multiple", key: "multiple" },
      { label: "Native American", key: "native american" },
      { label: "Other", key: "other" },
      { label: "Pacific Islander", key: "pacific islander" },
      { label: "White", key: "white" }
    ];
    var total = hood.total;

    demos.forEach(function(d) {
      var value = hood[d.key];
      [
        { element: singleBar, prop: "sf" },
        { element: multiBar, prop: "mf" }
      ].forEach(function({ element, prop }) {
        if (!total[prop]) return element.innerHTML = "NONE";
        var percent = value[prop] / total[prop] * 100;
        element.appendChild(m("div", {
          class: d.key + " block",
          style: `width: ${percent * .95}%`,
          "data-demo": d.key,
          "data-key": prop
        }, [
          m("div", { class: "tooltip" }, `
            <div class="block ${d.key}"></div>
            <div class="text"><b>${d.key}</b>: ${percent.toFixed(1)}% (${commafy(value[prop])})</div>
          `)
        ]));
      })
    });
  };

  var layer = L.geoJSON(data, {
    style: function(feature) {
      var name = feature.properties.neighborhood;
      var hood = hoods[name];
      var whiteness = hood.whiteness;
      var color = [255, 255, 255];
      if (whiteness < average) {
        var normal = (whiteness - lowestWhiteness) / (average - lowestWhiteness);
        color = colors.rgb.apply(null, lerp(colors.components.stDarkRed, [255, 255, 255], normal));
      } else {
        var normal = (highestWhiteness - whiteness) / (highestWhiteness - average);
        color = colors.rgb.apply(null, lerp(colors.components.stDarkPurple, [255, 255, 255], normal));
      }
      return {
        fillColor: color,
        fillOpacity: 1,
        weight: 1,
        color: colors.rgba(0, 0, 0, .2)
      }
    },
    onEachFeature: function(feature, shape) {
      var name = feature.properties.neighborhood;
      var hood = hoods[name];
      shape.data = hood;
      shape.on("click", onClick);
    }
  });

  layer.addTo(map);
  map.fitBounds(layer.getBounds());
})