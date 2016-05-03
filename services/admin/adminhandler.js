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
            exports.getAllUnApprovedFarmers(callback);
            break;

        case "getUnapprovedProducts":
            exports.getAllUnApprovedProducts(callback);
            break;

        case "approveproduct":
            exports.approveproduct(message.data,callback);
            break;

        case "decline_request_product":
            exports.declineproduct(message.data,callback);
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


exports.declineproduct = function (info,callback) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("products").remove({"productID" : searchQuery.productID});
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




exports.approveproduct = function (info,callback) {
    var deferred = Q.defer();
    var searchQuery = JSON.parse(info);
    var cursor = MongoDB.collection("products").update({"productID" : searchQuery.productID},{$set : { "isApproved" : true }});
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
    var cursor = MongoDB.collection("users").find({"usertype" : UserTypes.FARMER, "isApproved": false }).limit(250);
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


exports.getAllUnApprovedProducts = function(callback) {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("products").find({ "isApproved": false }).limit(250);
    var productList = [];
    cursor.each(function (err, doc) {
        if (err) {
            callback(err, {
                statusCode: 500,
                error: err
            });
        }
        if (doc != null) {
            productList.push(doc);
        } else
        {
            callback(null, {
                statusCode: 200,
                data : productList
            });
        }
    });
};

exports.getAllUnApprovedCustomers = function(callback) {
    var deferred = Q.defer();
    var cursor = MongoDB.collection("users").find({"usertype" : "CUSTOMER", "isApproved": false}).limit(250);
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

