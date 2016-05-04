/**
 * Created by pratiksanglikar on 13/04/16.
 */
var MongoDB = require("../commons/mongodbhandler");
var Utilities = require("../commons/utilities");
var PasswordManager = require("../authentication/passwordmanager");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var GoogleMaps = require("../commons/googlemapshandler");
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');


exports.handleRequest = function (message, callback) {
	switch (message.type) {
		case "get_all_trucks":
			exports.getAllTrucks(message, callback);
			break;
		case "search":
			exports.searchByAnyAttributes(message.data, callback);
			break;
		case "pending_trucks":
			exports.getPendingTrucks(message, callback);
			break;
		case "truck_by_id":
			exports.getTruck(message.ssn, callback);
			break;
		case "update_truck":
			exports.updateTruckDriver(message.info, callback);
			break;
		case "sign_up_truck":
			exports.signuptruck(message.info, callback);
			break;
		case "delete_truck":
			exports.delete(message.ssn, callback);
			break;
		default:
			callback("Malformed request",{
				statusCode: 400,
				error: "Malformed Request"
			});
	}
}

/**
 * gets pending requests for the trucks.
 * @returns {*}
 */
exports.getPendingTrucks = function (message, callback) {
	var data = [];
	var cursor = MongoDB.collection("users").find({
		usertype: UserTypes.DRIVER,
		isApproved: false
	}).limit(250);
	cursor.each(function (error, doc) {
		if(error) {
			callback(error,{
				statusCode: 500,
				error: error
			});
		}
		if(doc != null) {
			data.push(doc);
		} else {
			callback(null, {
				statusCode: 200,
				response: data
			});
		}
	});
};

/**
 * function to sign up the new truck driver.
 * @param info
 * @returns {*|promise}
 */
exports.signuptruck = function (info, callback) {
	var address = info.address + "," + info.city + "," + info.state + "," + info.zipCode;
	var promise1 = GoogleMaps.getLatLang(address, info.zipCode);
	var deferred = Q.defer();
	var promise = _validateTrucksInfo(info);
	Q.all([promise, promise1]).done(function (values) {
		info.location = values[1];
		info = _sanitizeTrucksInfo(info);
		var cursor = MongoDB.collection("users").insert(info);
		cursor.then(function (user) {
			callback(null,{
				statusCode: 200,
				response: user
			});
		}).catch(function (error) {
			callback(error,{
				statusCode: 500,
				error: error
			});
		});
	}, function (error) {
		callback(error, {
			statusCode: 500,
			error: error
		});
	});
};

/**
 * returns the searched users from all attributes.
 * @param info
 * @returns {*|promise}
 */
exports.searchByAnyAttributes = function(info, callback) {
	var searchQuery = JSON.parse(info);
		searchQuery = _sanitizeForTruckUpdate(searchQuery);
	var truckList = [];
	var cursor = MongoDB.collection("users").find(searchQuery).limit(250);
	if(cursor != null)
	{
		cursor.each(function (err, doc) {
			if (err) {
				callback(err, {
					statusCode: 500,
					error: err
				});
			}
			if (doc != null) {
				truckList.push(doc);
			} else {
				callback(null, {
					statusCode: 200,
					response: truckList
				});
			}
		});
	}
	else
	{
		callback("There are no Advanced Search Records for Trucks",{
			statusCode: 500,
			error: "There are no Advanced Search Records for Trucks"
		});
	}
};

/**
 * deletes a driver with given ssn from the system.
 * @param ssn
 * @returns {*|promise}
 */
exports.delete = function (ssn) {
	var deferred = Q.defer();
	MongoDB.collection("users").remove({
		"ssn": ssn,
		 usertype: UserTypes.DRIVER
	}, function (err, numberOfRemoved) {
		if (err) {
			deferred.reject(err);
		}
		if (numberOfRemoved.result.n) {
			redis.del(ssn, function () {
				deferred.resolve();
			});
		} else {
			deferred.reject("Driver with given SSN not found in system!");
		}
	});
	return deferred.promise;
};

/**
 * returns a truck with given SSN.
 * @param ssn
 * @returns {*|promise}
 */
exports.getTruck = function(ssn, callback) {
	var user = null;

	redis.get(ssn, function (error, reply) {
		if(error) {
			callback(error, {
				statusCode: 500,
				error: error
			});
			return;
		}
		if(reply) {
			//console.log("Cache hit for truck " + ssn);
			callback(null, {
				statusCode: 200,
				response: JSON.parse(reply)
			});
		} else {
			//console.log("Cache miss for truck " + ssn);
			var cursor = MongoDB.collection("users").find({
				ssn: ssn,
				isApproved: true,
				usertype: UserTypes.DRIVER
			});
			cursor.each(function (error, doc) {
				if(error) {
					callback(error, {
						statusCode: 500,
						error: error
					});
				}
				if(doc == null) {
					if(user == null) {
						callback("Truck Driver not found!",{
							statusCode: 500,
							error: "Truck driver not found!"
						});
					} else {
						delete user.password;
						redis.set(ssn, JSON.stringify(user), function () {
							//console.log("Inserting truck  " + ssn + " into cache!");
							callback(null,{
								statusCode: 200,
								response: user
							});
						});
					}
				} else {
					user = doc;
				}
			});
		}
	});
};

/**
 * returns the all the trucks in the system.
 * @returns {*|promise}
 */
exports.getAllTrucks = function (payload, callback) {
	var cursor = MongoDB.collection("users").find({
		isApproved: true,
		usertype: UserTypes.DRIVER
	}).limit(250);
	var trucks = [];
	cursor.each(function (error, doc) {
		if (error) {
			callback(error, {
				statusCode: 500,
				error: error
			});
		}
		if (doc != null) {
			trucks.push(doc);
		} else {
			callback(null,{
				statusCode: 200,
				response: trucks
			});
		}
	});
};

/**
 * function to sanitize the provided input.
 * @param info
 * @private
 */
_sanitizeTrucksInfo = function (info) {
	info.password = PasswordManager.encryptPassword(info.password);
	info.usertype = UserTypes.DRIVER;
	info.isApproved = false;
	info.freeFrom = new Date().getTime();
	return info;
};

/**
 * function to update the truck driver.
 * @param info
 */
exports.updateTruckDriver = function (info, callback) {
	var cursor = MongoDB.collection("users").update({"ssn" : info.ssn},
		{
			"firstName" : info.firstName,
			"lastName" : info.lastName,
			"email" : info.email,
			"password" : info.password,
			"phoneNumber" : info.phoneNumber,
			"ssn" : info.ssn,
			"address" : info.address,
			"state" : info.state,
			"city" : info.city,
			"zipCode" : info.zipCode,
			"isApproved" : info.isApproved,
			"usertype" : info.usertype,
			"location" : info.location,
			"truckManufacturer" : info.truckManufacturer,
			"truckModel" : info.truckModel,
			"freeFrom" : info.freeFrom
		});
	cursor.then(function (result) {
		callback(null,{
			statusCode: 200,
			response: result
		});
	}).catch(function (error) {
		callback(error, {
			statusCode: 500,
			error: error
		});
	});
};

/**
 * function that sanitizes the information provided through UI.
 * @param info
 * @private
 */
_sanitizeForTruckUpdate = function (info) {
	var newInfo = {};
	if(!Utilities.isEmpty(info.firstName)) {
		newInfo.firstName = info.firstName;
	}
	if(!Utilities.isEmpty(info.lastName)) {
		newInfo.lastName = info.lastName;
	}
	if(!Utilities.isEmpty(info.address)) {
		newInfo.address = info.address;
	}
	if(!Utilities.isEmpty(info.city)) {
		newInfo.city = info.city;
	}
	if(!Utilities.isEmpty(info.state)) {
		newInfo.state = info.city;
	}
	if(!Utilities.isEmpty(info.zipCode)) {
		newInfo.zipCode = info.zipCode;
	}
	if(!Utilities.isEmpty(info.phoneNumber)) {
		newInfo.phoneNumber = info.phoneNumber;
	}
	newInfo.usertype = "DRIVER";

	return newInfo;
};

/**
 * function to validate the given input.
 * validations provided -
 *        check if the email id is already registered.
 *        check if values are provided for all required fields.
 * @param info
 * @returns {*|promise}
 * @private
 */
_validateTrucksInfo = function (info) {
	var deferred = Q.defer();
	var promise = Utilities.validateEmail(info.email);
	var promise1 = Utilities.validateSSN(info.ssn);
	Q.all([promise, promise1]).done(function () {
		if (Utilities.isEmpty(info.ssn) ||
			Utilities.isEmpty(info.firstName) ||
			Utilities.isEmpty(info.lastName) ||
			Utilities.isEmpty(info.address) ||
			Utilities.isEmpty(info.city) ||
			Utilities.isEmpty(info.state) ||
			Utilities.isEmpty(info.zipCode) ||
			Utilities.isEmpty(info.phoneNumber) ||
			Utilities.isEmpty(info.password) ||
			Utilities.isEmpty(info.email)) {
			deferred.reject("All Values must be provided! ");
		} else {
			if (!Utilities.validateState(info.state)) {
				deferred.reject("Invalid state!");
			} else if (!Utilities.validateZipCode(info.zipCode)) {
				deferred.reject("Invalid zip code!");
			} else {
				deferred.resolve();
			}
		}
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
};