var http = require('http');
var url = require('url');
var fetch = require('node-fetch');

var PHOTON_URL = process.env.PHOTON_URL || "http://photon.komoot.de/"
var PHOTON_LANG = process.env.PHOTON_LANG || "en"

http.createServer(function (req, res) {
	let parsedUrl = url.parse(req.url, true)
	let path = parsedUrl.pathname


	switch (path) {
		case "/geocoding/v1/search":
			console.log("JAU")
			search(parsedUrl.query, res)
			break;
		case "/geocoding/v1/reverse":
				console.log("JAU")
				reverse(parsedUrl.query, res)
				break;
		default:
			res.writeHead(404, {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			});
			res.write('{"error": "path not found"}');
			res.end();
			break;
	}
	

}).listen(8020);

function search(params, res) {
	//console.log(params.text, res)
	let reqStart = new Date().valueOf()

	let bboxParam = null
	if (params['boundary.rect.min_lat'] && params['boundary.rect.max_lat'] && params['boundary.rect.min_lon'] && params['boundary.rect.max_lon']) {
		bboxParam = `&bbox=${params['boundary.rect.min_lon']},${params['boundary.rect.min_lat']},${params['boundary.rect.max_lon']},${params['boundary.rect.max_lat']}`
	}

	let url = `${PHOTON_URL}/api/?q=${encodeURIComponent(params.text)}&lang=${PHOTON_LANG}`
	if (bboxParam) {
		url += bboxParam
	}
	console.log(url)
	fetch(url).then(res => res.json()).then((json)=>{
		//console.log(json)
		
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		res.write(JSON.stringify(translateSearch(json)));
		res.end();
		console.log(new Date().valueOf() - reqStart)
	}).catch(err => {
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		res.write(JSON.stringify({error: err}))
		res.end()
	})
}

function reverse(params, res) {
	if (params['point.lat'] && params['point.lon']) {
		let url = `${PHOTON_URL}/reverse?lon=${params['point.lon']}&lat=${params['point.lat']}&lang=${PHOTON_LANG}`
		console.log(url)
		fetch(url).then(res => res.json()).then((json)=>{
			res.writeHead(200, {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			});
			console.log(JSON.stringify(json))
			res.write(JSON.stringify(translateReverse(json)));
			res.end();
		}).catch(err => {
			res.writeHead(200, {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			});
			res.write(JSON.stringify({error: err}))
			res.end()
		})

	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		});
		res.write(JSON.stringify({error: "point.lat and point.lon are required"}))
		res.end()
	}
}

function translateSearch(photonResult) {
	let peliasResponse = {
		features: []
	}
	photonResult.features.forEach(feature => {
		//console.log(feature.properties)
		if (feature.properties.state) {
			feature.properties.region = feature.properties.state
			delete feature.properties.state
		}
		if (feature.properties.postcode) {
			feature.properties.postalcode = feature.properties.postcode
			delete feature.properties.postcode
		}
		if (feature.properties.city) {
			feature.properties.locality = feature.properties.city
		}
		
		peliasResponse.features.push(feature)
	});
	return peliasResponse
}

function translateReverse(photonResult){
	let peliasResponse = {
		features: []
	}
	photonResult.features.forEach(feature => {
		//console.log(feature.properties)
		if (feature.properties.state) {
			feature.properties.region = feature.properties.state
			delete feature.properties.state
		}
		if (feature.properties.postcode) {
			feature.properties.postalcode = feature.properties.postcode
			delete feature.properties.postcode
		}
		if (feature.properties.city) {
			feature.properties.locality = feature.properties.city
		}
		let originalname = feature.properties.name
		feature.properties.name = `${feature.properties.street ? feature.properties.street : ''} ${feature.properties.housenumber ? feature.properties.housenumber : ''}`
		if (!feature.properties.street && !feature.properties.housenumber && originalname) {
			feature.properties.name = originalname
		}
		if (!feature.properties.street && !feature.properties.housenumber && !originalname && feature.properties.postalcode) {
			feature.properties.name = feature.properties.postalcode
		}
		
		
		peliasResponse.features.push(feature)
	});
	return peliasResponse
}