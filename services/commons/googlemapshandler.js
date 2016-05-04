/**
 * Created by pratiksanglikar on 21/04/16.
 */
GoogleMaps = null;
var GoogleMapsAPI = require("googlemaps");
var q = require("q");
var directionsCache = {};

/**
 * initializes the GoogleMaps API to be used in application.
 */
exports.initGoogleMaps = function () {
	GoogleMaps = new GoogleMapsAPI({
		key: "AIzaSyC-6Up5K0M_egpVpDL1oX8gk6rp79vG5yU",
		stagger_time: 1000, // for elevationPath
		encode_polylines: false,
		secure: true
	});
};

var zipCache = {};

/**
 * returns the latitude longitude of the location provided specified by address.
 * @param address
 * @returns {*|promise}
 */
exports.getLatLang = function (address, zipCode) {
	var deferred = q.defer();
	if(zipCache[zipCode]) {
		deferred.resolve(zipCache[zipCode]);
		return deferred.promise;
	} else {
		if (!GoogleMaps) {
			exports.initGoogleMaps();
		}
		GoogleMaps.geocode({
			"address": address
		}, function (err, result) {
			if (err) {
				deferred.reject(err);
			} else {
				if(result.results) {
					var results = [];
					results.push(result.results[0].geometry.location.lat);
					results.push(result.results[0].geometry.location.lng);
					zipCache[zipCode] = results;
					deferred.resolve(results);
				} else {
					deferred.reject();
				}
			}
		});
	}
	return deferred.promise;
};

/**
 * returns the time required for travel and legs in the travel for given origin and destination.
 * @param origin
 * @param destination
 */
exports.getDirections = function (origin, destination) {
	var string = origin[0]+origin[1]+destination[0]+destination[1];
	var deferred = q.defer();
	if(directionsCache[string]) {
		deferred.resolve(directionsCache[string]);
		return deferred.promise;
	}
	if (!GoogleMaps) {
		exports.initGoogleMaps();
	}
	var originString = origin[0] + " , " + origin[1];
	var destinationString = destination[0] + " , " + destination[1];
	var params = {
		origin: originString,
		destination: destinationString,
		mode: 'driving',
		departure_time: new Date(new Date().getTime() + 3600000),
		traffic_model: 'pessimistic'
	};
	GoogleMaps.directions(params, function (err, result) {
		if (err) {
			deferred.reject(err);
		} else {
			if(result.routes) {
				var tripDetails = {
					timeRequired: result.routes[0].legs[0].duration_in_traffic.value,
					steps: _extractSteps(result.routes[0].legs[0].steps)
				}
				directionsCache[string] = tripDetails;
				deferred.resolve(directionsCache[string]);
			} else {
				deferred.reject();
			}
		}
	});
	return deferred.promise;
}

/**
 * extracts useful information from all the information that Google Maps provides.
 * @param steps
 * @returns {Array}
 * @private
 */
_extractSteps = function (steps) {
	var extractedSteps = [];
	for(var i = 0 ; i < steps.length ; i++) {
		extractedSteps.push({
			location: [steps[i].end_location.lat, steps[i].end_location.lng],
			duration: steps[i].duration.value * 100
		});
	}
	return extractedSteps;
}
