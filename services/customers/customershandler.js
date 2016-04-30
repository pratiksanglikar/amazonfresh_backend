/**
 * Created by Chinmay on 16-04-2016.
 */

var MongoDB = require("../commons/mongodbhandler");
var Utilities = require("../commons/utilities");
var PasswordManager = require("../authentication/passwordmanager");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var GoogleMaps = require("../commons/googlemapshandler");

exports.signup = function(info)
{
    var deferred = Q.defer();
    var promise = _validateCustomerInfo(info);
	var address = info.address + "," + info.city + "," + info.state + "," + info.zipCode;
	var promise1 = GoogleMaps.getLatLang(address);
    Q.all([promise, promise1]).done(function (values) {
        info = _sanitizeCustomerInfo(info);
		info.location = values[1];
		var cursor = MongoDB.collection("users").insert(info);
        cursor.then(function (user) {
            deferred.resolve(user);
        }).catch(function (error) {
            deferred.reject(error);
        });
    },function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};

/**
 * deletes a customer with given ssn from the system.
 * @param ssn
 * @returns {*|promise}
 */
exports.deleteCustomer = function (ssn) {
    var deferred = Q.defer();
    MongoDB.collection("users").remove({
        "ssn": ssn
    }, function (err, numberOfRemoved) {
        if(err) {
            deferred.reject(err);
        }
        if(numberOfRemoved.result.n) {
            deferred.resolve();
        } else {
            deferred.reject("Customer with given SSN not found in system!");
        }
    });
    return deferred.promise;
};

/**
 * Get list of all the customer with given ssn from the system.

 */
exports.getCustomersList = function()
{
    console.log("In get list function");
    var customers = [];
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : "CUSTOMER"});
    if(cursor != null)
    {
        cursor.each(function(err,doc){
            if(err)
            {
                deferred.reject("Error is - "+err);
            }
            else if(doc != null)
            {
                customers = customers.concat(doc);
            }
            else
            {
                deferred.resolve(customers);
            }
        });
    }
    else
    {
        deferred.reject("There are no Records for Customers");
    }
    return deferred.promise;
};

/**
 * finds a customer with given ssn.
 * @param ssn
 * @returns {*|promise}
 */
exports.getCustomer = function (ssn) {
	var deferred = Q.defer();
	var customer;
	var cursor = MongoDB.collection("users").find({ssn: ssn});
	cursor.each(function (error, doc) {
		if (error) {
			deferred.reject(error);
		}
		if (doc != null) {
			customer = doc;
		} else {
			if (customer === null) {
				deferred.reject("Customer not found!");
			} else {
				console.log(customer);
				deferred.resolve(customer);
			}
		}
	});
	return deferred.promise;
};

_validateCustomerInfo = function (info) {
    var deferred = Q.defer();
    var promise = Utilities.validateEmail(info.email);
    var promise1 = Utilities.validateSSN(info.ssn);
    Q.all([promise, promise1]).done(function () {
        if( Utilities.isEmpty(info.ssn)		 	||
            Utilities.isEmpty(info.firstName) 	||
            Utilities.isEmpty(info.lastName) 	||
            Utilities.isEmpty(info.address)	 	||
            Utilities.isEmpty(info.city) 		||
            Utilities.isEmpty(info.state) 		||
            Utilities.isEmpty(info.zipCode) 	||
            Utilities.isEmpty(info.phoneNumber) ||
            Utilities.isEmpty(info.password) 	||
            Utilities.isEmpty(info.email)       ||
            Utilities.isEmpty(info.cardName)    ||
            Utilities.isEmpty(info.cardNumber)  ||
            Utilities.isEmpty(info.expiry))
        {
            deferred.reject("All values must be provided! ");
        } else {
            if(!Utilities.validateState(info.state)) {
                deferred.reject("Invalid state!");
            } else
            if(!Utilities.validateZipCode(info.zipCode)) {
                deferred.reject("Invalid zip code!");
            }
            else
            {
                deferred.resolve();
            }
        }
    }, function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};

_sanitizeCustomerInfo = function (info) {
    console.log("In cust sanitize");
    info.password = PasswordManager.encryptPassword(info.password);
    info.usertype = UserTypes.CUSTOMER;
	info.isApproved = false;
    return info;
};

exports.customerViewInfo = function(info)
{
    var deferred = Q.defer();
    var info = JSON.parse(info);
    var cursor = MongoDB.collection("users").find({"ssn": info.ssn});
    var customerList = {};
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            customerList = doc;
        } else {
            console.log(customerList);
            deferred.resolve(customerList);
        }
    });
    return deferred.promise;

};


exports.updateCustomer = function(info)
{
    var deferred = Q.defer();
    console.log(info);
    var promise = _validateCustomerInfo1(info);
    promise.done(function () {
        console.log("Repeater");
        var cursor = MongoDB.collection("users").update({"ssn": info.ssn,"usertype" : "CUSTOMER"},
            {
                "ssn": info.ssn,
                "firstName" : info.firstName,
                "lastName": info.lastName,
                "address": info.address,
                "city": info.city,
                "state" : info.state,
                "zipCode" : info.zipCode,
                "phoneNumber" : info.phoneNumber,
                "email" : info.email,
                "password" : info.password,
                "usertype" : info.usertype,
                "isApproved" : info.isApproved,
                "location" : info.location,
                "cardName" : info.cardName,
                "cardNumber" : info.cardNumber,
                "expiry" : info.expiry
            });
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


exports.searchCustomerInfo = function(info)
{
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var searchQuery = _sanitizeCustomerSearchInput(searchQuery);
    console.log("Query for searching is :"+searchQuery);
    var customerList = [];
    var cursor = MongoDB.collection("users").find(searchQuery);
    if(cursor != null)
    {
        cursor.each(function (err, doc) {
            if (err) {
                deferred.reject(err);
            }
            if (doc != null) {
                customerList.push(doc);
            } else {
                deferred.resolve(customerList);
            }
        });
    }
    else
    {
        deferred.reject("There are no Advanced Search Records for Customers");
    }

    return deferred.promise;
};

_sanitizeCustomerSearchInput = function(info){

    if( Utilities.isEmpty(info.ssn))
        delete info.ssn;

    if ( Utilities.isEmpty(info.firstName))
        delete info.firstName;

    if ( Utilities.isEmpty(info.lastName))
        delete info.lastName;

    if ( Utilities.isEmpty(info.address))
        delete info.address;

    if ( Utilities.isEmpty(info.city))
        delete info.city;

    if ( Utilities.isEmpty(info.state))
        delete info.state;

    if ( Utilities.isEmpty(info.zipCode))
        delete info.zipCode;

    if ( Utilities.isEmpty(info.phoneNumber))
        delete info.phoneNumber;

    if ( Utilities.isEmpty(info.email))
        delete info.email;

    if ( Utilities.isEmpty(info.cardName))
        delete info.cardName;

    if ( Utilities.isEmpty(info.cardNumber))
        delete info.cardNumber;

    info.usertype = "CUSTOMER";

    return info;

};

_validateCustomerInfo1 = function(info)
{
    var deferred = Q.defer();
    if( Utilities.isEmpty(info.ssn)		 	||
        Utilities.isEmpty(info.firstName) 	||
        Utilities.isEmpty(info.lastName) 	||
        Utilities.isEmpty(info.address)	 	||
        Utilities.isEmpty(info.city) 		||
        Utilities.isEmpty(info.state) 		||
        Utilities.isEmpty(info.zipCode) 	||
        Utilities.isEmpty(info.phoneNumber) ||
        Utilities.isEmpty(info.password) 	||
        Utilities.isEmpty(info.email))
    {
        console.log("error from here");
        deferred.reject("All values must be provided! ");
    } else {
        if(!Utilities.validateState(info.state)) {
            console.log("invalid sate");
            deferred.reject("Invalid state!");
        } else
        if(!Utilities.validateZipCode(info.zipCode)) {
            console.log("invalid zip code");
            deferred.reject("Invalid zip code!");
        } else
        {
            deferred.resolve();
        }
    }
    return deferred.promise;
};