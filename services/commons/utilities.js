/**
 * Created by pratiksanglikar on 13/04/16.
 */

var MongoDB = require("./mongodbhandler");
var Q = require("q");
var USStates = require("./constants").USStates;

/**
 * checks if the email id provided is a valid email address.
 * checks if the email id provided is already registered in the system.
 * @param email
 * @returns {promise}
 */
exports.validateEmail = function (email) {
	var promise = Q.defer();

	if(exports.isEmpty(email)) {
		promise.reject("Email ID empty!");
		return promise.promise;
	}

	/* check if the email id provided is a valid email ID */
	var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(!regex.test(email)) {
		promise.reject("Invalid email address");
		return promise.promise;
	}

	var found = null;
	var cursor = MongoDB.collection("users").find({ email: email });
	cursor.each(function (error, user) {
		if(error) {
			promise.reject(error);
		}
		if(user != null) {
			found = user;
		} else {
			if(found) {
				promise.reject("Email already registered!");
			} else {
				promise.resolve();
			}
		}
	});
	return promise.promise;
}

/**
 * checks if the provided SSN is empty.
 * checks if the provided SSN is in correct format.
 * @param ssn
 * @returns {promise}
 */
exports.validateSSN = function (ssn) {
	var promise = Q.defer();

	if(exports.isEmpty(ssn)) {
		promise.reject("SSN is empty!");
		return promise.promise;
	}

	var regex = /\d{3}-\d{2}-\d{4}/;
	if(!regex.test(ssn)) {
		promise.reject("Invalid SSN");
		return promise.promise;
	}

	var found = null;
	var cursor = MongoDB.collection("users").find({ ssn: ssn });
	cursor.each(function (error, user) {
		if(error) {
			promise.reject(error);
		}
		if(user != null) {
			found = user;
		} else {
			if(found) {
				promise.reject("SSN already registered!");
			} else {
				promise.resolve();
			}
		}
	});
	return promise.promise;
}
/**
 * Verify the password.
 */

/**
 * validates the provided zip code.
 * - checks if the zip code is empty
 * - checks if the zip code is in valid format.
 * @param zipCode
 * @returns {boolean}
 */
exports.validateZipCode = function (zipCode) {
	if(exports.isEmpty(zipCode)) {
		return false;
	}
	var regex = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
	if(!regex.test(zipCode)) {
		return false;
	}
	return true;
}

/**
 * checks if the given value is empty or not.
 * @returns true if the provided value is empty
 * 			false if the provided value is not empty
 * @param {boolean} isEmpty
 */
exports.isEmpty = function (value) {
	if(value === undefined || value === null || value === "") {
		return true;
	}
	return false;
}

/**
 * validates if the provided state is a valid US state.
 * @param state
 * @returns {boolean}
 */
exports.validateState = function (state) {
	if(USStates[state] != null) {
		return true;
	}
	return false;
}

