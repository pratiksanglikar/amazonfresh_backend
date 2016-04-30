/**
 * Created by pratiksanglikar on 12/04/16.
 */
pool = null;
var mysql = require('mysql');
var Q = require('q');

/**
 * executes the query provided in sqlQuery and returns the result.
 * @param sqlQuery
 * @returns {promise}
 */
exports.executeQuery = function (sqlQuery) {
	var promise = _getConnection();
	var deferred = Q.defer();
	promise.done(function (connection) {
		connection.query(sqlQuery, function (err, rows) {
			if (!err) {
				connection.commit(function (error) {
					if (error) {
						deferred.reject(error);
						_releaseConnection(connection);
					} else {
						deferred.resolve(rows);
						_releaseConnection(connection);
					}
				});
			}
			else {
				deferred.reject(err);
				_releaseConnection(connection);
			}
		});
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
};

/**
 * executes the set of queries as a transaction provided in an array.
 * Note: Even if any query fails to execute, the whole transaction is rollbacked.
 * @param queries - Array of queries.
 * @returns {promise}
 */
exports.executeTransaction = function (queries) {
	var deferred = Q.defer();
	var connectionPromise = _getConnection();
	var results = [];
	connectionPromise.done(function (connection) {
		connection.beginTransaction(function (error) {
			if (error) {
				deferred.reject(error);
				_releaseConnection(connection);
			} else {
				for (var i = 0; i < queries.length; i++) {
					//console.log("Executing transaction query : " + queries[i]);
					connection.query(queries[i], function (error, result) {
						if (error) {
							connection.rollback();
							deferred.reject(error);
							_releaseConnection(connection);
						} else {
							results.push(result);
						}
					});
				}
				connection.commit(function (error) {
					if (error) {
						deferred.reject(error);
						_releaseConnection(connection);
					} else {
						deferred.resolve(results);
						_releaseConnection(connection);
					}
				});
			}
		});
	}, function (error) {
		deferred.reject(error);
	});

	return deferred.promise;
};


/**
 * returns the current database connection pool
 * @returns {pool}
 * @private
 */
function _getPool() {
	if (pool == undefined) {
		pool = _createPool({
			host: 'sql3.freemysqlhosting.net',
			user: 'sql3117040',
			password: '5eHPZkWr6h',
			database: 'sql3117040',
			poolsize: 10
		});
	}
	return pool;
}

/**
 * creates the database connection pool
 * @param config
 * @returns {{getConnection: pool.getConnection, release: pool.release}}
 * @private
 */
function _createPool(config) {
	console.log("Creating pool of size : " + config.poolsize);
	var pool = {
		_connections: [],

		/**
		 * gets one connection from connection pool.
		 * @returns {connection}
		 */
		getConnection: function () {
			var def = Q.defer();
			if (this._connections.length > 0) {
				var connection = this._connections.shift();
				def.resolve(connection);
			} else {
				def.reject("No more connections available in pool");
			}
			return def.promise;
		},

		/**
		 * releases the connection acquired from the connection pool
		 * @param connection
		 */
		release: function (connection) {
			//connection.end();
			this._connections.push(connection);
		}
	};
	var poolSize = config.poolsize || 10;
	for (var i = 0; i < poolSize; i++) {
		var connection = mysql.createConnection({
			host: config.host,
			user: config.user,
			password: config.password,
			database: config.database
		});
		pool._connections.push(connection);
	}
	return pool;
}

/**
 * returns a connection from the database connection pool.
 * @returns {connection}
 * @private
 */
function _getConnection() {
	pool = _getPool();
	var deferred = Q.defer();
	var promise = pool.getConnection();
	promise.done(function (connection) {
		if (connection) {
			deferred.resolve(connection);
		}
	}, function (error) {
		deferred.reject(error);
	});
	return deferred.promise;
}

/**
 * releases the connection acquired from database connection pool.
 * @param connection
 * @private
 */
function _releaseConnection(connection) {
	pool = _getPool();
	try {
		pool.release(connection);
	} catch (error) {
		console.log(error);
	}
}