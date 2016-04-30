/**
 * Created by pratiksanglikar on 13/04/16.
 */
var MongoDB = require("../commons/mongodbhandler");
var Utilities = require("../commons/utilities");
var PasswordManager = require("../authentication/passwordmanager");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var GoogleMaps = require("../commons/googlemapshandler");

/**
 * gets pending requests for the trucks.
 * @returns {*}
 */
exports.getPendingTrucks = function () {
	var deferred = Q.defer();
	var data = [];
	var cursor = MongoDB.collection("users").find({
		usertype: UserTypes.DRIVER,
		isApproved: false
	});
	cursor.each(function (error, doc) {
		if(error) {
			deferred.reject(error);
		}
		if(doc != null) {
			data.push(doc);
		} else {
			deferred.resolve(data);
		}
	});
	return deferred.promise;
};

/**
 * function to sign up the new truck driver.
 * @param info
 * @returns {*|promise}
 */
exports.signuptruck = function (info) {
	var address = info.address + "," + info.city + "," + info.state + "," + info.zipCode;
	var promise1 = GoogleMaps.getLatLang(address);
	var deferred = Q.defer();
	var promise = _validateTrucksInfo(info);
	Q.all([promise, promise1]).done(function (values) {
		info.location = values[1];
		info = _sanitizeTrucksInfo(info);
		var cursor = MongoDB.collection("users").insert(info);
		cursor.then(function (user) {
			deferred.resolve(user);
		}).catch(function (error) {
			deferred.reject(error);
		});
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
};

/**
 * returns the searched users from all attributes.
 * @param info
 * @returns {*|promise}
 */
exports.searchByAnyAttributes = function(info){
	var deferred = Q.defer();
	var searchQuery = JSON.parse(info);
		searchQuery = _sanitizeForTruckUpdate(searchQuery);
	var truckList = [];
	var cursor = MongoDB.collection("users").find(searchQuery);
	if(cursor != null)
	{
		cursor.each(function (err, doc) {
			if (err) {
				deferred.reject(err);
			}
			if (doc != null) {
				truckList.push(doc);
			} else {
				deferred.resolve(truckList);
			}
		});
	}
	else
	{
		deferred.reject("There are no Advanced Search Records for Trucks");
	}
	return deferred.promise;
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
			deferred.resolve();
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
exports.getTruck = function(ssn) {
	var deferred = Q.defer();
	var user = null;
	var cursor = MongoDB.collection("users").find({
		ssn: ssn,
		isApproved: true,
		usertype: UserTypes.DRIVER
	});
	cursor.each(function (error, doc) {
		if(error) {
			deferred.reject(error);
		}
		if(doc == null) {
			if(user == null) {
				deferred.reject("Truck Driver not found!");
			} else {
				deferred.resolve(user);
			}
		} else {
			user = doc;
		}
	});
	return deferred.promise;
};

/**
 * returns the all the trucks in the system.
 * @returns {*|promise}
 */
exports.getAllTrucks = function () {
	var deferred = Q.defer();
	var cursor = MongoDB.collection("users").find({
		isApproved: true,
		usertype: UserTypes.DRIVER
	});
	var trucks = [];
	cursor.each(function (error, doc) {
		if (error) {
			deferred.reject(error);
		}
		if (doc != null) {
			trucks.push(doc);
		} else {
			deferred.resolve(trucks);
		}
	});
	return deferred.promise;
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
exports.updateTruckDriver = function (info) {
	var deferred = Q.defer();
	console.log("Information in trucksHandler :"+ info.ssn);
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
		deferred.resolve(result);
	}).catch(function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
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