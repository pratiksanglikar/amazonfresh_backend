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
	/*var info = message.info;
	var customerSSN = message.customerSSN;
	var dynamicPricingPromise = [];
	var billID_new = Crypto.createHash('sha1').update(customerSSN + new Date().getTime()).digest('hex');
	var deferred = Q.defer();
	//var customer_id = ;
	var sqlQuery = "INSERT INTO bill (bill_id, order_date, total_amount, customer_id) " +
		"VALUES (" + billID_new + " , sysdate() , " + info.total_amount + ", '" + customerSSN + "');";
	var insertInBillPromise = Mysql.executeQuery(sqlQuery);
	var getTripIdPromise = [];
	var insertInItemPromise = [];
	insertInBillPromise.done(function () {
		var billId = billID_new;
		var tempPromise;
		for (var key in info.product_details) {
			var product_id = info.product_details[key].product_id;
			tempPromise = TripHandler.generateTrip(customerSSN, info.product_details[key].farmer_id, product_id);
			getTripIdPromise.push(tempPromise);
		}
		var tripResult = [];
		Q.all(getTripIdPromise).done(function (tripResult) {
			//tripResult = tripResult.response;
			for (var i = 0; i < tripResult.length; i++) {
				var tripId = tripResult[i].tripID;
				//expectedDeliveryDate = new Date(tripResult.deliveryTime).toISOString().slice(0, 19).replace('T', ' ');
				var expectedDeliveryDate = tripResult[i].deliveryTime;
				sqlQuery = "select count(*) as count,  product_id, product_name, price_per_unit from item where product_id = '" + info.product_details[i].product_id + "' group by product_id";
				tempPromise = Mysql.executeQuery(sqlQuery);
				dynamicPricingPromise.push(tempPromise);
				sqlQuery = "INSERT INTO item" +
					" ( bill_id, product_id, customer_id, quantity, price_per_unit, trip_id, expected_delivery_date, product_name, product_image_url ) " +
					"VALUES (" + billId + ", '" + info.product_details[i].product_id + "', '" + customerSSN + "', " + info.product_details[i].quantity + ", " + info.product_details[i].price_per_unit + ",'" + tripId + "', '" + expectedDeliveryDate + "','" + info.product_details[i].product_name + "', '" + info.product_details[i].product_image_url + "');";
				//sqlQuery = "INSERT INTO item ( bill_id, product_id, quantity, price_per_unit, trip_id, expected_delivery_date, product_name ) VALUES (14, '2c07429444b3bcc71b7b7cadf90f999537a581ad', 1, 5,'fb2589be6d9aae01efaeea104f41035464330e83', '1461748542953','Peanuts');"
				tempPromise = Mysql.executeQuery(sqlQuery);
				insertInItemPromise.push(tempPromise);
			}
			Q.all(dynamicPricingPromise).done(function (dynamicPricingResult) {
				for (var j = 0; j < dynamicPricingPromise.length; j++) {
					for (var i = 0; i < dynamicPricingResult[j].length; i++) {
						ProductHandler.adjustDynamicPrice(dynamicPricingResult[j][i].product_id, dynamicPricingResult[j][i].count, dynamicPricingResult[j][i].price_per_unit);
					}
				}
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
	});
	Q.all(insertInItemPromise).done(function () {
		callback(null, {
			statusCode: 200
		});
	}, function (error) {
		callback(error, {
			statusCode: 500,
			error: error
		});
	});*/

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

    //

   // return deferred.promise;


exports.addrating = function (message, callback) {
    //var deferred = Q.defer();
    info = message.info;
    var cursor = MongoDB.collection("products").find({"productID" : info.product_id});
    cursor.each(function (error, doc) {
        if (error) {
                callback(error, {
                    statusCode: 500,
                    error: error
                });
        }
        if (doc != null) {
            var setnumberOfRatings = doc.numberOfRatings + 1;
            var setrating = ((doc.rating*doc.numberOfRatings) + Number(info.rating))/setnumberOfRatings;
            var cursor = MongoDB.collection("products").update({"productID" : info.product_id},{$set : {"rating" : setrating, "numberOfRatings" :  setnumberOfRatings}});
            cursor.then(function () {
				redis.set(productID, doc, function () {
					callback(null,{
						statusCode: 200
					});
				});
            }).catch(function (error) {
                callback(error, {
                    statusCode: 500,
                    error: error
                });
            });
        }
        else {
            callback("Product not found!",{
                statusCode: 500,
                error: "Product not found!"
            });
        }
    });
    //return deferred.promise;
};

exports.revenue = function ( callback) {
    var deferred = Q.defer();
    var sqlQuery = "SELECT order_date as date, SUM(total_amount) as revenue " +
        "FROM bill GROUP BY CAST(order_date AS DATE);";
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
    //return deferred.promise;
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
