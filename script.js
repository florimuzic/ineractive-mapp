// Same five shades per continent as the original map
var palettes = {
  EU: ["#809bce", "#7291cc", "#6983b3", "#6d90d1", "#506ca1"],
  NA: ["#8a508f", "#b771bd", "#9f6fa3", "#865e8a", "#ac69b3"],
  SA: ["#8a508f", "#b771bd", "#9f6fa3", "#865e8a", "#ac69b3"],
  AF: ["#b8e0d4", "#a3c4ba", "#a3d4c5", "#88bdad", "#91e3ca"],
  AS: ["#eac4d5", "#eac4d5", "#dea0bc", "#d1a3b8", "#eda6c6"],
  OC: ["#d6eadf", "#deffed", "#bae3cd", "#9dc4af", "#cef0de"]
};

function shadeFor(id, continentCode) {
  var p = palettes[continentCode];
  if (!p) return "#eeeeee";
  return p[id.charCodeAt(0) % p.length];
}

var root = am5.Root.new("chartdiv");
root.setThemes([am5themes_Animated.new(root)]);

var chart = root.container.children.push(am5map.MapChart.new(root, {
  panX: "rotateX",
  projection: am5map.geoMercator()
}));
chart.set("zoomControl", am5map.ZoomControl.new(root, {}));

function styleTemplate(t) {
  t.setAll({
    tooltipText: "{name}",
    interactive: true,
    fill: am5.color(0xeeeeee),
    fillOpacity: 0.7,
    stroke: am5.color(0xffffff),
    strokeWidth: 1
  });
  t.states.create("hover", {
    fill: am5.color(0xdddddd),
    fillOpacity: 1,
    stroke: am5.color(0x666666),
    strokeWidth: 2
  });
}

// World view
var worldSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
  geoJSON: am5geodata_worldLow,
  exclude: ["AQ"]
}));
styleTemplate(worldSeries.mapPolygons.template);
worldSeries.mapPolygons.template.set("templateField", "polygonSettings");

// Country view (after clicking a country)
var countrySeries = chart.series.push(am5map.MapPolygonSeries.new(root, { visible: false }));
styleTemplate(countrySeries.mapPolygons.template);

worldSeries.mapPolygons.template.events.on("click", function (ev) {
  var dataItem = ev.target.dataItem;
  var d = dataItem.dataContext;
  if (!d || !d.map) return;
  var zoomAnimation = worldSeries.zoomToDataItem(dataItem);

  Promise.all([
    zoomAnimation.waitForStop(),
    am5.net.load("https://cdn.amcharts.com/lib/5/geodata/json/" + d.map + ".json", chart)
  ]).then(function (results) {
    var geodata = am5.JSONParser.parse(results[1].response);
    countrySeries.mapPolygons.template.set("fill", d.polygonSettings.fill);
    countrySeries.setAll({ geoJSON: geodata });
    countrySeries.show();
    worldSeries.hide(100);
    document.getElementById("back").style.display = "block";
  });
});

// Colour data for each country
var data = [];
for (var id in am5geodata_data_countries2) {
  if (am5geodata_data_countries2.hasOwnProperty(id)) {
    var c = am5geodata_data_countries2[id];
    if (c.maps.length) {
      data.push({
        id: id,
        map: c.maps[0],
        polygonSettings: { fill: am5.color(shadeFor(id, c.continent_code)) }
      });
    }
  }
}
worldSeries.data.setAll(data);

document.getElementById("back").addEventListener("click", function () {
  chart.goHome();
  worldSeries.show();
  countrySeries.hide();
  this.style.display = "none";
});