var MongoDB = require("../commons/mongodbhandler");
var PasswordManager = require("./passwordmanager");
var Q = require("q");

/**
 * lets the user log in into the system.
 * @param emailID
 * @param password
 */
exports.login = function (emailID, password) {
	var deferred = Q.defer();
	var found = null;
	var cursor = MongoDB.collection("users").find({
		email: emailID
	});
	cursor.each(function (err, user) {
		if(err) {
			deferred.reject({
				statusCode: 500,
				error: err
			});
		}
		if(user != null) {
			found = user;
		} else {
			if(found) {
				if(found.password === PasswordManager.encryptPassword(password)) {
					delete found.password;
					deferred.resolve(found);
				} else {
					deferred.reject({
						statusCode: 401,
						error: "Invalid credentials!"
					});
				}
			} else {
				deferred.reject({
					statusCode: 500,
					error: "User not found!"
				});
			}
		}
	});
	return deferred.promise;
};