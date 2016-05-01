/**
 * Created by SHAILESH-PC on 4/24/2016.
 */

var MongoDB = require("../commons/mongodbhandler");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var CustomerHandler = require("../customers/customershandler");

exports.handleRequest = function (message, callback) {
    switch (message.type){
        case "listUnapprovedCustomers":
            exports.getAllUnApprovedCustomers(callback);
            break;

        case "approve_request":
            exports.approvecreatefarmer(message.data, callback);
            break;

        case "decline_request":
            exports.declinefarmer(message.data, callback);
            break;


        case "customer_advanced_search":
            CustomerHandler.searchCustomerInfo(message.data, callback);
            break;

        case "view_customer":
            CustomerHandler.customerViewInfo(message.data, callback);
            break;

        case "getUnapprovedFarmers":
            exports.getAllUnApprovedFarmers( callback);
            break;
    }
}


exports.approvecreatefarmer = function (info,callback) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("users").update({"ssn" : searchQuery.ssn},{$set :{"isApproved" : true}});
        cursor.then(function () {
            callback(null, {
                statusCode: 200,
                error: null
            });
        }).catch(function (error) {
            callback(error, {
                statusCode: 500,
                error: error
            });
        });
};

exports.declinefarmer = function (info,callback) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("users").remove({"ssn" : searchQuery.ssn});
    cursor.then(function (){

        callback(null, {
            statusCode: 200,
            error: null
        });
    }).catch(function (error) {
        callback(error, {
            statusCode: 500,
            error: error
        });
    });
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




exports.getAllUnApprovedFarmers = function(callback) {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : UserTypes.FARMER, "isApproved": false });
    var farmerList = [];
    cursor.each(function (err, doc) {
        if (err) {
            callback(err, {
                statusCode: 500,
                error: err
            });
        }
        if (doc != null) {
            farmerList.push(doc);
        } else
        {
            callback(null, {
                statusCode: 200,
                error: null,
                data : farmerList
            });
        }
    });
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

exports.getAllUnApprovedCustomers = function(callback) {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : "CUSTOMER", "isApproved": false});
    var customerList = [];
    cursor.each(function (err, doc) {
        if (err) {
            callback(err, {
                statusCode: 500,
                error: err
            });
        }
        if (doc != null) {
            customerList.push(doc);
        } else
        {
            callback(null, {
                statusCode: 200,
                error: null,
                data : customerList
            });
        }
    });
};

