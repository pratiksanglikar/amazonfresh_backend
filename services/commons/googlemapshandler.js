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
	// new key =
	GoogleMaps = new GoogleMapsAPI({
		key: "AIzaSyBvEf5eMse2J5C2p0wcMtmZ2uFPwppkMYQ",
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
exports.getDirections = function (origin, destination, origincity, destcity) {
	var string = origincity + destcity;
	string = string.replace(' ','');
	var deferred = q.defer();
	if(directionsCache[string]) {
		console.log("Google Maps Cache hit! " + string);
		deferred.resolve(directionsCache[string]);
		return deferred.promise;
	} else {
		console.log("Google Maps Cache miss! " + string);
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
				if(result.routes && result.routes[0]) {
					var tripDetails = {
						timeRequired: result.routes[0].legs[0].duration_in_traffic.value,
						steps: _extractSteps(result.routes[0].legs[0].steps)
					}
					directionsCache[string] = tripDetails;
					deferred.resolve(directionsCache[string]);
				} else {
					var tripDetails = {
						timeRequired: 98786,
						steps: [{
							location: origin,
							duration: 0
						}, {
							location: destination,
							duration: 98786
						}]
					}
					directionsCache[string] = tripDetails;
					deferred.resolve(tripDetails);
				}
			}
		});
	}
	
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
