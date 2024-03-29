/**
 * Created by pratiksanglikar on 09/04/16.
 */
//super simple rpc server example
var amqp = require("amqp"),
	util = require("util"),
	MongoDB = require("./services/commons/mongodbhandler");

var Trips = require("./services/trips/tripshandler");
var farmers = require("./services/farmers/farmerhandler.js");
var Trucks = require("./services/trucks/truckshandler");
var Product = require("./services/products/productshandler");
var Bill = require("./services/bills/billshandler");
var PopulateDB = require("./services/populateDB/PopulateDB");


var Customers = require("./services/customers/customershandler");
var Admin = require("./services/admin/adminhandler");
var connection = amqp.createConnection({host: "127.0.0.1"});

MongoDB.connect(MongoDB.MONGODB_URL, function () {
	console.log('Connected to mongo at: ' + MongoDB.MONGODB_URL);
});

connection.on("ready", function () {
	listenToQueue(connection, "trips_queue", Trips);
	listenToQueue(connection, "farmer_queue", farmers);
	listenToQueue(connection, "trucks_queue", Trucks);
	listenToQueue(connection, "products_queue", Product);
	listenToQueue(connection, "customers_queue", Customers);
	listenToQueue(connection, "admin_queue", Admin);
	listenToQueue(connection, "bills_queue", Bill);
	listenToQueue(connection, "populateDB_queue", PopulateDB);
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