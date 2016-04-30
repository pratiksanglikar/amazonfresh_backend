/**
 * Created by SHAILESH-PC on 4/24/2016.
 */

var MongoDB = require("../commons/mongodbhandler");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;

exports.approvecreatefarmer = function (info) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("users").update({"ssn" : searchQuery.ssn},{$set :{"isApproved" : true}});
        cursor.then(function (user) {
            deferred.resolve(user);
        }).catch(function (error) {
            deferred.reject(error);
        });
    return deferred.promise;
};

exports.declinefarmer = function (info) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("users").remove({"ssn" : searchQuery.ssn});
    cursor.then(function (user) {
        deferred.resolve(user);
    }).catch(function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};


exports.declineproduct = function (info) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("products").remove({"productID" : searchQuery.productID});
    cursor.then(function (user) {
        deferred.resolve(user);
    }).catch(function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};




exports.approveproduct = function (info) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("products").update({"productID" : searchQuery.productID},{$set : { "isApproved" : true }});
    cursor.then(function (user) {
        deferred.resolve(user);
    }).catch(function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};


exports.approvecustomer = function (info) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    console.log(searchQuery);
    var cursor = MongoDB.collection("users").update({"ssn" : searchQuery.info.ssn},{$set : { "isApproved" : true }});
    cursor.then(function (user) {
        deferred.resolve(user);
    }).catch(function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};




exports.getAllUnApprovedFarmers = function() {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : UserTypes.FARMER, "isApproved": false });
    var farmerList = [];
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            farmerList.push(doc);
        } else
        {
            deferred.resolve(farmerList);
        }
    });
    return deferred.promise;
};


exports.getAllUnApprovedProducts = function() {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("products").find({ "isApproved": false });
    var productList = [];
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            productList.push(doc);
        } else
        {
            deferred.resolve(productList);
        }
    });
    return deferred.promise;
};

exports.getAllUnApprovedCustomers = function() {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : "CUSTOMER", "isApproved": false});
    var customerList = [];
    cursor.each(function (err, doc) {
        if (err) {
            deferred.reject(err);
        }
        if (doc != null) {
            customerList.push(doc);
        } else
        {
            deferred.resolve(customerList);
        }
    });
    return deferred.promise;
};

