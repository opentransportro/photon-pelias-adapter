var http = require("http");
var url = require("url");
var fetch = require("node-fetch");

var PHOTON_URL = process.env.PHOTON_URL || "https://photon.komoot.io";
var PORT = process.env.PORT || 8080;

const { translateResults, translateReverseGeocoding } = require("./translate.js");

http
  .createServer(function(req, res) {
    let parsedUrl = url.parse(req.url, true);
    let path = parsedUrl.pathname;

    switch (path) {
      case "/v1/search":
        search(parsedUrl.query, res);
        break;
      case "/v1/reverse":
        reverse(parsedUrl.query, res);
        break;
      default:
        writeError(res, 404, "path not found");
        break;
    }
  })
  .listen(PORT);

const OSM_TAG_FILTERS = [
  "!amenity:car_sharing",
  "!amenity:bike_rental",
  "!historic:memorial",
  "!boundary",
  "!landuse:construction",
  "!highway:service",
  //  exclude unneccessarily detailed public transport nodes
  ":!stop_position",
  ":!platform",
  "!tunnel:yes",
  "!place:county",
  "!railway:razed",
  "!landuse:military"
];

const DEFAULT_ZOOM_FACTOR = 14;
const DEFAULT_LOCATION_BIAS_SCALE = 0.5;

function search(params, res) {
  let bboxParam = null;
  let focusParam = null;
  let filterParam = null;
  let optionalGtfsDataset = "";
  // TODO: remove this later. Force lang to english
  params.lang = "en";

  if (params["layers"] && params["layers"].includes("bikestation")) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.write(JSON.stringify({ error: "no gtfs", features: [] }));
    res.end();
    return;
  } else if (
    params["sources"] &&
    params["sources"].split(",").length == 1 &&
    params["sources"].split(",")[0].startsWith("gtfs")
  ) {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    });
    res.write(JSON.stringify({ error: "no gtfs", features: [] }));
    res.end();
    return;
  } else {
    filterParam = OSM_TAG_FILTERS.map(e => `&osm_tag=${e}`).join("");
  }

  if (
    params["boundary.rect.min_lat"] &&
    params["boundary.rect.max_lat"] &&
    params["boundary.rect.min_lon"] &&
    params["boundary.rect.max_lon"]
  ) {
    bboxParam = `&bbox=${params["boundary.rect.min_lon"]},${params["boundary.rect.min_lat"]},${
      params["boundary.rect.max_lon"]
    },${params["boundary.rect.max_lat"]}`;
  }

  if (params["focus.point.lat"] && params["focus.point.lon"]) {
    focusParam = `&lon=${params["focus.point.lon"]}&lat=${params["focus.point.lat"]}`;
    focusParam += `&zoom=${DEFAULT_ZOOM_FACTOR}`;
    focusParam += `&location_bias_scale=${DEFAULT_LOCATION_BIAS_SCALE}`;
  }

  let url = `${PHOTON_URL}/api/?q=${encodeURIComponent(params.text)}&lang=${params.lang || "en"}`;
  if (bboxParam) {
    url += bboxParam;
  }
  if (focusParam) {
    url += focusParam;
  }
  url += filterParam;

  fetch(url)
    .then(res => res.json())
    .then(json => {
      if (!json.features) {
        writeError(res, 500, "no result from service");
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      res.write(JSON.stringify(translateResults(json, optionalGtfsDataset)));
      res.end();
    })
    .catch(err => {
      writeError(res, 500, err);
    });
}

function reverse(params, res) {
  const lat = params["point.lat"];
  const lon = params["point.lon"];
  // TODO: remove this later. Force lang to english
  params.lang = "en";

  if (params["point.lat"] && params["point.lon"]) {
    let url = `${PHOTON_URL}/reverse?lon=${params["point.lon"]}&lat=${params["point.lat"]}&lang=${params.lang || "en"}`;
    fetch(url)
      .then(res => res.json())
      .then(json => {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        });
        res.write(JSON.stringify(translateReverseGeocoding(lat, lon, json)));
        res.end();
      })
      .catch(err => {
        console.log(err);
        writeError(res, 500, err);
      });
  } else {
    writeError(res, 400, "point.lat and point.lon are required");
  }
}

function writeError(res, statusCode, errorMessage) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  });
  res.write(JSON.stringify({ error: errorMessage }));
  res.end();
}
