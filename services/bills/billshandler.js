/**
 * Created by Abhay on 4/16/2016.
 */

var Q = require("q");
var TripHandler = require("../trips/tripshandler");
var Mysql = require("../commons/mysqlhandler");
var ProductHandler = require("../products/productshandler");


exports.generatebill = function (info,customerSSN) {
    var dynamicPricingPromise = [];
    var deferred = Q.defer();
    //var customer_id = ;
    var sqlQuery = "INSERT INTO bill (order_date, total_amount, customer_id) " +
        "VALUES (sysdate(), " + info.total_amount + ", '" + customerSSN + "');";
    console.log(sqlQuery)
    var insertInBillPromise = Mysql.executeQuery(sqlQuery);
    var getTripIdPromise = [];
    var insertInItemPromise = [];
    insertInBillPromise.done(function () {
        var getBillIdPromise = Mysql.executeQuery("SELECT max(bill_id) as max_bill_id from bill;");
        var billId;
        getBillIdPromise.done(function (rows) {
            billId = rows[0].max_bill_id;

            var tempPromise;
            for (var key in info.product_details) {
                var product_id = info.product_details[key].product_id;
                tempPromise = TripHandler.generateTrip(customerSSN, info.product_details[key].farmer_id, product_id);
                getTripIdPromise.push(tempPromise);

            }
            var tripResult = [];
            Q.all(getTripIdPromise).done(function (tripResult) {
                for (var i=0; i<tripResult.length; i++) {
                    tripId = tripResult[i].tripID;
                    //expectedDeliveryDate = new Date(tripResult.deliveryTime).toISOString().slice(0, 19).replace('T', ' ');
                    expectedDeliveryDate = tripResult[i].deliveryTime;
                    sqlQuery = "select count(*) as count,  product_id,product_name, price_per_unit from item where product_id = '" + info.product_details[i].product_id + "' group by product_id";
                    tempPromise = Mysql.executeQuery(sqlQuery);
                    dynamicPricingPromise.push(tempPromise);
                    sqlQuery = "INSERT INTO item" +
                        " ( bill_id, product_id, customer_id, quantity, price_per_unit, trip_id, expected_delivery_date, product_name, product_image_url ) " +
                        "VALUES (" + billId + ", '" + info.product_details[i].product_id + "', '" + customerSSN + "', " + info.product_details[i].quantity + ", " + info.product_details[i].price_per_unit + ",'" + tripId + "', '" + expectedDeliveryDate + "','" + info.product_details[i].product_name + "', '" + info.product_details[i].product_image_url + "');";
                    console.log(sqlQuery)
                    //sqlQuery = "INSERT INTO item ( bill_id, product_id, quantity, price_per_unit, trip_id, expected_delivery_date, product_name ) VALUES (14, '2c07429444b3bcc71b7b7cadf90f999537a581ad', 1, 5,'fb2589be6d9aae01efaeea104f41035464330e83', '1461748542953','Peanuts');"
                    tempPromise = Mysql.executeQuery(sqlQuery);
                    insertInItemPromise.push(tempPromise);
                }
                Q.all(dynamicPricingPromise).done( function (dynamicPricingResult){
                    for(var j = 0;  j < dynamicPricingPromise.length ; j++) {
                        for (var i=0; i<dynamicPricingResult[j].length; i++) {
                            ProductHandler.adjustDynamicPrice(dynamicPricingResult[j][i].product_id, dynamicPricingResult[j][i].count, dynamicPricingResult[j][i].price_per_unit);
                        }
                    }

                });
            }, function (error) {
                deferred.reject(error);
            })
        }, function (error) {
            deferred.reject(error);
        })
        Q.all(insertInItemPromise).done(function () {
            deferred.resolve()
        }, function (error) {
            deferred.reject(error);
        })
    }, function (error) {
        deferred.reject(error);
    })

    //

    return deferred.promise;
}
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

/**
 * searches all bills with given customer id.
 */
exports.getallbills = function (customerId) {
    var deferred = Q.defer();
    var result = {};
    var getJoinPromise = Mysql.executeQuery("SELECT * FROM bill, item Where bill.customer_id = '" + customerId + "' AND bill.bill_id = item.bill_id ;");
    getJoinPromise.done(function(joinResult){
        for(var i=0 ; i < joinResult.length ; i++){
            if(!result[joinResult[i].bill_id]) {
                result[joinResult[i].bill_id] = {};
                result[joinResult[i].bill_id].bill_id = joinResult[i].bill_id;
                result[joinResult[i].bill_id].order_date = joinResult[i].order_date;
                result[joinResult[i].bill_id].total_amount = joinResult[i].total_amount;
                result[joinResult[i].bill_id].item_details = [];
            }
            result[joinResult[i].bill_id].item_details.push({
                "trip_id" : joinResult[i].trip_id,
                "product_id" : joinResult[i].product_id,
                "quantity" : joinResult[i].quantity,
                "price_per_unit" : joinResult[i].price_per_unit,
                // "trip_id" : joinResult[i].trip_id,
                "expected_delivery_date" : joinResult[i].expected_delivery_date,
                "product_name" : joinResult[i].product_name,
                "product_image_url" : joinResult[i].product_image_url
            });
        }
        deferred.resolve(result);
    }, function (error) {
        deferred.reject(error);
    });
    return deferred.promise;

};

exports.getallbillsadmin = function () {
    var deferred = Q.defer();
    var result = {};
    var getJoinPromise = Mysql.executeQuery("SELECT * FROM bill, item Where bill.bill_id = item.bill_id ;");
    getJoinPromise.done(function(joinResult){
        for(var i=0 ; i < joinResult.length ; i++){
            if(!result[joinResult[i].bill_id]) {
                result[joinResult[i].bill_id] = {};
                result[joinResult[i].bill_id].bill_id = joinResult[i].bill_id;
                result[joinResult[i].bill_id].order_date = joinResult[i].order_date;
                result[joinResult[i].bill_id].total_amount = joinResult[i].total_amount;
                result[joinResult[i].bill_id].customer_id = joinResult[i].customer_id;
                result[joinResult[i].bill_id].item_details = [];
            }
            result[joinResult[i].bill_id].item_details.push({
                "trip_id" : joinResult[i].trip_id,
                "product_id" : joinResult[i].product_id,
                "quantity" : joinResult[i].quantity,
                "price_per_unit" : joinResult[i].price_per_unit,
                "trip_id" : joinResult[i].trip_id,
                "expected_delivery_date" : joinResult[i].expected_delivery_date,
                "product_name" : joinResult[i].product_name,
                "product_image_url" : joinResult[i].product_image_url
            });
        }
        deferred.resolve(result);
    }, function (error) {
        deferred.reject(error);
    });
    return deferred.promise;

};

exports.revenue = function () {
    console.log("itha ala")
    var deferred = Q.defer();
    var sqlQuery = "SELECT order_date as date, SUM(total_amount) as revenue " +
        "FROM bill GROUP BY CAST(order_date AS DATE);";
    var promise = Mysql.executeQuery(sqlQuery);
    promise.done( function(rows){
        deferred.resolve(rows);
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
