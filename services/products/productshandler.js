/**
 * Created by Dell on 15-04-2016.
 */
var MongoDB = require("../commons/mongodbhandler");
var Utilities = require("../commons/utilities");
var Q = require("q");
var UserTypes = require("../commons/constants").usertypes;
var Crypto = require("crypto");
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');

exports.handleRequest = function (message, callback) {
	switch (message.type){

		case "createproduct":
			exports.createproduct(message.info, message.user, callback);
			break;
		case "delete":
			exports.delete(message.productID, callback);
			break;
		case "listallproducts":
			exports.listallproducts(message.payload, callback);
			break;
		case "getproductinfo":
			exports.getproductinfo(message.productID, callback);
			break;
		case "delete_product":
			exports.delete(message.productID, callback);
			break;

		case "product_viewInfo":
			exports.searchByProductId(message.data, callback);
			break;

		case "advanced_search_product":
			exports.searchProductInfo(message.data, callback);
			break;

		case "update_products":
			console.log("In update products");
			exports.updateproduct(message.data, callback);
			break;

		default:
			callback("Bad Request", {
				statusCode: 400,
				error: "Bad Request!"
			});
	}
}



exports.adjustDynamicPrice = function (productId, count, productPrice) {
	var deferred = Q.defer();
	var promise = null;
	if(count < 10) {
		deferred.resolve();
		return;
	}
    if(count == 10) {
		promise = exports.setProductPrice(productId, productPrice * 1.10);
	}
	if(count == 50) {
		promise = exports.setProductPrice(productId, productPrice * 1.25);
	}
	if(count == 500) {
		promise = exports.setProductPrice(productId, productPrice * 1.50)
	}
	if(promise) {
		promise.done(function () {
			deferred.resolve();
		}, function (error) {
			deferred.reject(error);
		});
	}
    return deferred.promise;
}

exports.setProductPrice = function (productId, price) {
	var deferred = Q.defer();
	var cursor = MongoDB.collection("products").update({productID: productId},{$set:{productPrice: price}});
	cursor.then(function () {
		deferred.resolve();
	}).catch(function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
}

/**
 * function to create product.
 * @param info
 * @returns {*|promise}
 */
exports.createproduct = function (info, user, callback) {
	var productID = Crypto.createHash('sha1').update(info.productName + user.ssn + new Date().getTime()).digest('hex');
	info.productID = productID;
	var deferred = Q.defer();
	if (UserTypes.FARMER == user.usertype) {
		var isValid = _validateProductInfo(info);
		if (isValid) {
			info = _sanitizeProductInfo(info, user);
			var cursor = MongoDB.collection("products").insert(info);
			cursor.then(function (user) {
				callback(null, {
					statusCode: 200,
					response: user
				});
				//deferred.resolve(user);
			}).catch(function (error) {
				callback(error, {
					statusCode: 500,
					error: error
				});
				// deferred.reject(error);
			});
		} else {
			callback("All values must be provided!", {
				statusCode: 500,
				error: "All values must be provided!"
			});
			//deferred.reject("All values must be provided!");
		}
	} else {
		//deferred.reject("Not a farmer!");
		callback("All values must be provided!", {
			statusCode: 500,
			error: "All values must be provided!"
		});
	}
};

/**
 * deletes a driver with given ssn from the system.
 * @param ssn
 * @returns {*|promise}
 */
exports.delete = function (productID) {
	var deferred = Q.defer();
	MongoDB.collection("products").remove({
		"productID": productID
	}, function (err, numberOfRemoved) {
		if (err) {
			deferred.reject(err);
		}
		if (numberOfRemoved.result.n) {
			redis.del(productID, function () {
				deferred.resolve();
			});
		} else {
			deferred.reject("Product with given ID not found in system!");
		}
	});
	return deferred.promise;
};

/**
 * function to list all products.
 * @returns {*|promise}
 */
exports.listallproducts = function (message,callback) {
	var deferred = Q.defer();
	var productList = [];
	var cursor = MongoDB.collection("products").find({
		isApproved: true
	});
	if (cursor != null) {
		cursor.each(function (err, doc) {
			if (err) {
				callback(err, {
					statusCode: 500,
					error: err
				});
				//deferred.reject(err);
			}
			else if (doc != null) {
				productList = productList.concat(doc);
			}
			else {
				callback(null, {
					statusCode: 200,
					response: productList
				});
				//deferred.resolve(productList);
			}
		});
	}
	else {
		callback("No records for products!", {
			statusCode: 500,
			error: "No records for products!"
		});
		//deferred.reject("There are no Records for products");
	}

};
/**
 *
 *  function to get a single product .
 * @returns {*|promise}
 */
exports.getproductinfo = function (productID, callback) {
	var deferred = Q.defer();
	redis.get(productID, function (error, reply) {
		if(error) {
			deferred.reject(error);
			if(callback) {
				callback(error, {
					statusCode: 500,
					error: error
				});
			}
		} else {
			if(reply) {
				deferred.resolve(JSON.parse(reply));
				if(callback) {
					callback(null, {
						statusCode: 200,
						response: JSON.parse(reply)
					});
				}
			} else {
				var product = null;
				var cursor = MongoDB.collection("products").find({
					productID: productID
				});
				cursor.each(function (error, doc) {
					if (error) {
						deferred.reject(error);
						if(callback) {
							callback(error, {
								statusCode: 500,
								error: error
							});
						}
					}
					if (doc != null) {
						product = doc;
					} else {
						if (product === null) {
							deferred.reject("Product with given ID not found!");
							if(callback) {
								callback("Product with given ID not found!", {
									statusCode: 500,
									error: "Product with given ID not found!"
								});
							}
						} else {
							redis.set(productID, JSON.stringify(product), function () {
								deferred.resolve(product);
								if(callback) {
									callback(null, {
										statusCode: 200,
										response: product
									});
								}
							});
						}
					}
				});
			}
		}
	});
	return deferred.promise;
};

/**
 * function to get a single product .
 * @returns {*|promise}
 */
exports.searchProductInfo = function (info,callback) {
	var deferred = Q.defer();
	var searchQuery = JSON.parse(info);
	var searchQuery = _sanitizeProductSearchInput(searchQuery);
	var productList = [];
	var cursor = MongoDB.collection("products").find(searchQuery);
	if (cursor != null) {
		cursor.each(function (err, doc) {
			if (err) {
				callback(err, {
					statusCode: 500,
					error: err
				});
			}
			if (doc != null) {
				productList.push(doc);
			} else {
				callback(null, {
					statusCode: 200,
					data: productList
				});
			}
		});
	}
	else {
		callback(null, {
			statusCode: 500,
			error: "Product Not found"
		});
	}
};

_sanitizeProductSearchInput = function (info) {
	if (Utilities.isEmpty(info.productName))
		delete info.productName;
	if (Utilities.isEmpty(info.productPrice))
		delete info.productPrice;
	if (Utilities.isEmpty(info.description))
		delete info.description;
	if (Utilities.isEmpty(info.farmerFirstName))
		delete info.farmerFirstName;
	if (Utilities.isEmpty(info.farmerLastName))
		delete info.farmerLastName;
	if (Utilities.isEmpty(info.farmerSSN))
		delete info.farmerSSN;
	return info;
};

exports.searchByProductId = function (info,callback) {
	var deferred = Q.defer();
	var info = JSON.parse(info);
	var cursor = MongoDB.collection("products").find({"productID": info.productID, isApproved: true});
	var productList = {};
	cursor.each(function (err, doc) {
		if (err) {
			callback(err, {
				statusCode: 500,
				error: err
			});
		}
		if (doc != null) {
			productList = doc;
		} else {
			callback(null, {
				statusCode: 200,
				data: productList
			});
		}
	});
};

exports.searchproduct = function (productName) {
	var deferred = Q.defer();
	var product = MongoDB.collection("products").findOne({"productName": productName},
		function (err, doc) {
			if (err) {
				deferred.reject(err);
			}
			if (doc != null) {
				product = doc;
				console.log(product);
				deferred.resolve(product);
			}
			else {
				deferred.reject("There are no Records for product");
			}
		});
	return deferred.promise;
};

exports.updateproduct = function (info, callback) {
	var deferred = Q.defer();
	//var promise = _validateProductInfo(info);
	var cursor = MongoDB.collection("products").update({"productID": info.productID},
		{
			"productID": info.productID,
			"productName": info.productName,
			"productPrice": info.productPrice,
			"description": info.description,
			"productImage": info.productImage,
			"farmerFirstName": info.farmerFirstName,
			"farmerLastName": info.farmerLastName,
			"farmerSSN": info.farmerSSN,
			"reviews": info.reviews,
			"isApproved": info.isApproved
		});
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

/**
 * function to sanitize the provided input.
 * @param info
 * @private
 */
_sanitizeProductInfo = function (info, user) {
	info.farmerFirstName = user.firstName;
	info.farmerLastName = user.lastName;
	info.farmerSSN = user.ssn;
	info.reviews = [];
	info.isApproved = false;
	info.rating = 3.4;
	info.numberOfRatings = 5;
	delete info.ssn;
	return info;
}

/**
 * function to validate the given input.
 * validations provided -
 *        check if the email id is already registered.
 *        check if values are provided for all required fields.
 * @param info
 * @returns {*|promise}
 * @private
 */
_validateProductInfo = function (info) {
	if (Utilities.isEmpty(info.productName) || Utilities.isEmpty(info.productPrice) || Utilities.isEmpty(info.description)) {
		return false;
	}
	else {
		return true;
	}
};
