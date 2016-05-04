/**
 * Created by Abhay on 4/16/2016.
 */

var Q = require("q");
var TripHandler = require("../trips/tripshandler");
var Mysql = require("../commons/mysqlhandler");
var ProductHandler = require("../products/productshandler");
var MongoDB = require("../commons/mongodbhandler");
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');
var Crypto = require("crypto");

exports.handleRequest = function (message, callback) {
    switch (message.type) {
        case "revenue":
            exports.revenue(callback);
            break;
        case "generatebill":
            exports.generatebill(message, callback);
            break;
        case "addrating":
            exports.addrating(message, callback);
            break;
        default:
            callback("Bad Request", {
                statusCode: 400,
                error: "Bad Request!"
            });
    }
}

exports.generatebill = function (message, callback) {
	var customerSSN = message.customerSSN;
	var billID = Crypto.createHash('sha1').update(customerSSN + new Date().getTime()).digest('hex');
	var sqlQuery = "INSERT INTO bill (bill_id, order_date, total_amount, customer_id) " +
		"VALUES ('" + billID + "' , sysdate() , " + message.info.total_amount + ", '" + customerSSN + "');";
	var insertInBillPromise = Mysql.executeQuery(sqlQuery);
	insertInBillPromise.done(function (result) {
		var productDetails = message.info.product_details;
		var tripsPromises = [];
		for(var i = 0 ; i < productDetails.length ; i++ ) {
			tripsPromises.push(TripHandler.generateTrip(customerSSN, productDetails[i].farmer_id, productDetails[i].product_id));
		}
		Q.all(tripsPromises).done(function (values) {
			var itemQueries = [];
			var itemQuery = null;
			for(var j = 0; j < productDetails.length; j++) {
				var productHash = Crypto.createHash('sha1').update(customerSSN+productDetails[j].product_id+new Date().getTime()).digest('hex');
				itemQuery = "INSERT INTO ITEM values ( '" + productHash + "','" +
					billID + "' , '" + productDetails[j].product_id + "' , '" + customerSSN + "' , " + productDetails[j].quantity + " , " +
					productDetails[j].price_per_unit + " , '" + values[j].tripID + "' , '" + values[j].deliveryTime + "' , '" +
						productDetails[j].product_name + "' , '" + productDetails[j].product_image_url + "');";
				itemQueries.push(itemQuery);
			}
			var itemPromise = Mysql.executeTransaction(itemQueries);
			itemPromise.done(function (result) {
				var dynamicPriceQueries = [];
				var dynamicPriceQuery;
				for(var k = 0 ; k < productDetails.length ; k++) {
					dynamicPriceQuery = "select count(*) AS count, avg(item.price_per_unit) as price_per_unit, item.product_id from item, bill where item.bill_id = bill.bill_id AND item.product_id = '" + productDetails[k].product_id + "' AND cast(bill.order_date as DATE) = CAST(sysdate() as date);";
					dynamicPriceQueries.push(dynamicPriceQuery);
				}
				var dynamicPricePromise = Mysql.executeTransaction(dynamicPriceQueries);
				dynamicPricePromise.done(function (dynamicResult) {
					var adjustDynamicPromises = [];
					for(var l = 0 ;l < productDetails.length; l++) {
						adjustDynamicPromises.push(ProductHandler.adjustDynamicPrice(dynamicResult[l][0].product_id, dynamicResult[l][0].count, dynamicResult[l][0].price_per_unit));
					}
					Q.all(adjustDynamicPromises).done(function () {
						callback(null, {
							statusCode: 200,
							error: null
						});
					}, function (error) {
						callback(error, {
							statusCode: 500,
							error: error
						});
					});
				}, function (error) {
					callback(error, {
						statusCode: 500,
						error: error
					});
				})
			}, function (error) {
				callback(error, {
					statusCode: 500,
					error: error,
					data: null
				});
			});
		}, function (error) {
			callback(error, {
				statusCode: 500,
				error: error,
				data: null
			});
		});
	}, function (error) {
		callback(error, {
			statusCode: 500,
			error: error,
			data: null
		});
	});
}


exports.addrating = function (message, callback) {
    var info = message.info;
	var product = null;
    var cursor = MongoDB.collection("products").find({"productID" : info.product_id});
    cursor.each(function (error, doc) {
        if (error) {
                callback(error, {
                    statusCode: 500,
                    error: error
                });
        }
        if (doc != null) {
			product = doc;
        }
        else {
			if(product === null) {
				callback("Product not found!",{
					statusCode: 500,
					error: "Product not found!"
				});
			} else {
				var setnumberOfRatings = product.numberOfRatings + 1;
				var setrating = ((product.rating * product.numberOfRatings) + Number(info.rating))/setnumberOfRatings;
				var cursor = MongoDB.collection("products").update({"productID" : info.product_id},{$set : {"rating" : setrating, "numberOfRatings" :  setnumberOfRatings}});
				cursor.then(function () {
					callback(null,{
						statusCode: 200
					});
				}).catch(function (error) {
					callback(error, {
						statusCode: 500,
						error: error
					});
				});
			}
        }
    });
};

exports.revenue = function ( callback) {
    var sqlQuery = "SELECT cast(order_date as date) , SUM(total_amount) as revenue FROM bill GROUP BY CAST(order_date AS DATE);";
    var promise = Mysql.executeQuery(sqlQuery);
    promise.done( function (rows) {
        callback(null,{
            statusCode: 200,
            response: rows
        });
    }, function (error) {
        callback(error, {
            statusCode: 500,
            error: error
        });
    });
};

exports.delete = function (billId) {
    var deferred = Q.defer();
    var promise = Mysql.executeQuery("DELETE FROM bill WHERE bill_id=" + billId + ";");
    promise.done( function(){
        deferred.resolve();
    },function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};

/**
 * searches a bill with given bill id.
 */
exports.searchbill = function (billId) {
    var deferred = Q.defer();
    var promise = _getOrder(billId);
    promise.done( function(order){
        deferred.resolve(order);
    }, function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};

function _getOrder(billId){
    var deferred = Q.defer();
    var getBillPromise = Mysql.executeQuery("SELECT * FROM bill WHERE bill_id=" + billId + ";");
    var billResult;
    getBillPromise.done(function(rows){
        billResult=rows;
    });
    var getItemPromise = Mysql.executeQuery("SELECT * FROM item WHERE bill_id=" + billId + ";");
    var itemResult;
    getItemPromise.done(function(rows){
        itemResult=rows;
    });
    Q.all([getBillPromise, getItemPromise]).done(function () {
        var result={"billResult":billResult,"itemResult":itemResult};
        deferred.resolve(result);
    }, function (error) {
        deferred.reject(error);
    });
    return deferred.promise;
};
