/**
 * Created by SHAILESH-PC on 4/14/2016.
 */

var MongoDB = require("../commons/mongodbhandler");
var Utilities = require("../commons/utilities");
var PasswordManager = require("../authentication/passwordmanager");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var GoogleMaps = require("../commons/googlemapshandler");

exports.createfarmer = function (info) {
    var deferred = Q.defer();
	var address = info.address + "," + info.city + "," + info.state + "," + info.zipCode;
	var promise1 = GoogleMaps.getLatLang(address);
    var promise = _validateFarmerInfo(info);
    Q.all([promise,promise1]).done(function (values) {
        info = _sanitizeFarmerInfo(info);
		info.location = values[1];
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

exports.delete = function (ssn) {
    console.log("ssn is " + ssn);
       var deferred = Q.defer();
    MongoDB.collection("users").remove({
        "ssn": ssn, "isApproved" : true
    }, function (err, numberOfRemoved) {
        if(err) {
            deferred.reject(err);
        }
        if(numberOfRemoved.result.n) {
            deferred.resolve();
        } else {
            deferred.reject("Farmer with given SSN not found in system!");
        }
    });
    return deferred.promise;
};

exports.getAllFarmers = function () {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype": "FARMER", "isApproved": true});
    var farmerList = [];
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            farmerList.push(doc);
        } else {
            deferred.resolve(farmerList);
        }
    });
    return deferred.promise;
};

exports.getFarmerInfo = function (ssn) {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"ssn": ssn});
    var farmerList = null;
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            farmerList = doc;
        } else {
            if (farmerList) {
                deferred.resolve(farmerList);
            } else {
                deferred.reject("Farmer not found!");
            }
        }
    });
    return deferred.promise;
};

exports.farmerViewInfo = function(info)
{
    var deferred = Q.defer();
    var info = JSON.parse(info);
    var cursor = MongoDB.collection("users").find({"ssn": info.ssn});
    var farmerList = {};
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            farmerList = doc;
        } else {
            deferred.resolve(farmerList);
        }
    });
    return deferred.promise;
};

exports.searchFarmerInfo = function(info)
{
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var searchQuery = _validateSearchInput(searchQuery);
    var farmerList = [];
    var cursor = MongoDB.collection("users").find(searchQuery);
    if(cursor != null)
    {
        cursor.each(function (err, doc) {
            if (err) {
                deferred.reject(err);
            }
            if (doc != null) {
                farmerList.push(doc);
            } else {
                deferred.resolve(farmerList);
            }
        });
    }
    else
    {
        deferred.reject("There are no Advanced Search Records for Farmers");
    }
    return deferred.promise;
};

exports.updateFarmer = function (info) {
    var deferred = Q.defer();
    var promise = _validateFarmerInfo1(info);
    promise.done(function () {
        var cursor = MongoDB.collection("users").update({"ssn": info.ssn,"usertype" : "FARMER"},
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
                "usertype" : UserTypes.FARMER,
                "isApproved" : info.isApproved,
                "rating" : info.rating,
                "reviews" : info.reviews,
                "location" : info.location
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

_sanitizeFarmerInfo = function (info) {
    info.password = PasswordManager.encryptPassword(info.password);
    info.usertype = UserTypes.FARMER;
	info.isApproved = false;
    info.rating = 0;
    info.reviews = [];
    return info;
};

_validateSearchInput = function (info)
{
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
    info.usertype = "FARMER";

    return info;
};


_validateFarmerInfo1 = function (info) {
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
        deferred.reject("All values must be provided! ");
    } else {
        if(!Utilities.validateState(info.state)) {
            deferred.reject("Invalid state!");
        } else
        if(!Utilities.validateZipCode(info.zipCode)) {
            deferred.reject("Invalid zip code!");
        } else
        {
            deferred.resolve();
        }
    }
    return deferred.promise;
};

_validateFarmerInfo = function (info) {
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
            Utilities.isEmpty(info.email))
        {
            deferred.reject("All values must be provided! ");
        } else {
            if(!Utilities.validateState(info.state)) {
                deferred.reject("Invalid state!");
            } else
            if(!Utilities.validateZipCode(info.zipCode)) {
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