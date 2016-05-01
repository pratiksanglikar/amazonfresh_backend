/**
 * Created by pratiksanglikar on 09/04/16.
 */
//super simple rpc server example
var amqp = require("amqp"),
	util = require("util"),
	MongoDB = require("./services/commons/mongodbhandler");

var Trips = require("./services/trips/tripshandler");
var Products = require("./services/products/productshandler");

var Trucks = require("./services/trucks/truckshandler");

var connection = amqp.createConnection({host: "127.0.0.1"});

MongoDB.connect(MongoDB.MONGODB_URL, function(){
	console.log('Connected to mongo at: ' + MongoDB.MONGODB_URL);
});

connection.on("ready", function () {
	listenToQueue(connection, "trips_queue", Trips);
	listenToQueue(connection, "trucks_queue", Trucks);

	listenToQueue(connection, "products_queue", Products);

});

var listenToQueue = function (connection, queueName, Handler) {
	connection.queue(queueName, function (q) {
		q.subscribe(function (message, headers, deliveryInfo, m) {
			Handler.handleRequest(message, function (err, res) {
				connection.publish(m.replyTo, res, {
					contentType: "application/json",
					contentEncoding: "utf-8",
					correlationId: m.correlationId
				});
			});
		});
	});
}