photon-pelias-adapter is a small API proxy to replace pelias geocoder with [photon](https://photon.komoot.de).
We use this to replace pelias with photon in [digitransit-ui](https://github.com/HSLdevcom/digitransit-ui/)

Supported pelias APIs:

* `/v1/search`
* `/v1/reverse`

Supported pelias paramters:
* for `search`
	* `text`
	* `boundary.rect`
	* `focus.point`
	* `lang`
	* returns empty results, if `sources` contains `gtfs`.
* for `reverse`
	* `point.lat` and `point.lon`
	* `lang`

Configuration:

* Set port via `PORT` environment variable. Default `8080`.
* Set Photon endpoint via environment variable `PHOTON_URL`. Default `https://photon.komoot.de`.

## How to start

Install required packages via `npm install`.

To run photon pelias with defaults (port 8080, connecting to https://photon.komoot.io/), run via

``` sh
$ node index.js
```

else

``` sh
$ node index.js
```

```
$ PHOTON_URL=https://photon.komoot.io/ PORT=8080 node index.js
```

Now you may test photon-pelias-adapter e.g. by requesting

```
http://localhost:8080/v1/search?text=Berlin
```
