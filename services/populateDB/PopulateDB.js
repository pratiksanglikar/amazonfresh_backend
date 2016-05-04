/**
 * Created by pratiksanglikar on 02/05/16.
 */
/**
 * Created by Dell on 15-04-2016.
 */
var UserTypes = require("../commons/constants").usertypes;
var Trucks = require("../trucks/truckshandler");
var Farmers = require("../farmers/farmerhandler");
var Customers = require("../customers/customershandler");
var Products = require("../products/productshandler");
var Bills = require("../bills/billshandler");
var Q = require("q");
var MongoDB = require("../commons/mongodbhandler");

exports.handleRequest = function (message, callback) {
	switch (message.type){

		case "populate_customers":
			populateCustomers(message, callback);
			break;
		case "populate_farmers":
			populateFarmers(message, callback);
			break;
		case "populate_drivers":
			populateDrivers(message, callback);
			break;
		case "populate_bills":
			populateBills(message, callback);
			break;
		case "populate_products":
			populateProducts(message, callback);
			break;
		default:
			callback("Bad Request", {
				statusCode: 400,
				error: "Bad Request!"
			});
	}
}

populateProducts = function (message, callback) {
	var i = 0;
	function myLoop(i) {
		setTimeout(function(){
			console.log(i);
			if(i < 9999) {
				i++;
				var info = getRandomProductInfo();
				var user = getRandomFarmer(i);
				Products.createproduct(info, user, function (error) {
					if(error) {
						console.log(error);
					} else {
						console.log("Product inserted successfully! " + i);
						myLoop(i);
					}
				});
			}
		},50);
	}
	myLoop(i);
}

getRandomProductInfo = function () {
	var min = 0;
	var max = randomProducts.length;
	var random = Math.floor(Math.random() * (max - min + 1)) + min;
	if(!randomProducts[random]) {
		return randomProducts[random - 1];
	} else {
		return randomProducts[random];
	}
}

getRandomFarmer = function (i) {
	var user = {};
	user.ssn = getFarmerSSN(i);
	user.firstName = "Farmer";
	user.lastName = "" + i;
	user.usertype = UserTypes.FARMER;
	return user;
}


populateCustomers = function (message, callback) {
	var i = 26 ;
	function myLoop(i) {
		setTimeout(function () {
			console.log(i);
			if(i < 10000) {

				var info = constructCustomerInfo(i);
				//Farmers.createfarmer(info, function (error) {
				Customers.signup(info, function(error) {
					if (error) {
						console.log(error);
					} else {
						myLoop(i++);
						console.log("Populated : " + info.firstName + " " + info.lastName);
					}
				});

			}
		}, 50);
	}
	myLoop(i);
}

constructCustomerInfo = function (i) {
	var info = {};
	var address = getRandomAddress();
	info.firstName = "Customer";
	info.lastName = "" + i;
	info.email = "customer"+ i + "@gmail.com";
	info.password = "Customer@" + i;
	info.ssn = getCustomerSSN(i);
	info.phoneNumber = "3"+info.ssn.replace('-','');
	info.address = address.address;
	info.state = address.state;
	info.city = address.city;
	info.zipCode = address.zipCode;
	info.cardName = "Customer " + i;
	info.cardNumber = "4322 2345 2345 2344";
	info.expiry = "02/20";
	return info;
}

populateFarmers = function (message, callback) {
	var i = 0;
	function myLoop(i) {
		setTimeout(function () {
			console.log(i);
			if(i < 9999) {
				i++;
				var info = constructFarmerInfo(i);
				Farmers.createfarmer(info, function (error) {
					if (error) {
						console.log(error);
					} else {
						console.log("Populated : " + info.firstName + " " + info.lastName);
					}
				});
				myLoop(i);
			}
		}, 50);
	}

	myLoop(i);
}

constructFarmerInfo = function (i) {
	var info = {};
	var address = getRandomAddress();
	info.firstName = "Farmer";
	info.lastName = "" + i;
	info.email = "farmer"+ i + "@gmail.com";
	info.password = "Farmer@"+i;
	info.ssn = getFarmerSSN(i);
	info.phoneNumber = "2" + info.ssn.replace('-','');
	info.address = address.address;
	info.state = address.state;
	info.city = address.city;
	info.zipCode = address.zipCode;
	info.url = "http://youtube.com/farmer" + i;
	return info;
}

populateDrivers = function (message, callback) {
	var i = 0;
	function myLoop(i) {
		setTimeout(function () {
			console.log(i);
			if(i < 259) {
				i++;
				var info = constructDriverInfo(i);
				Trucks.signuptruck(info, function (error) {
					if (error) {
						console.log(error);
					} else {
						console.log("Populated : " + info.firstName + " " + info.lastName);
					}
				});
				myLoop(i);
			}
		}, 150);
	}

	myLoop(i);
}

constructDriverInfo = function (i) {
	var info = {};
	var address = getRandomAddress();
	info.firstName = "Driver ";
	info.lastName = "" + i;
	info.email = "driver" + i + "@gmail.com";
	info.password = "Driver@" + i;
	info.state = address.state;
	info.city = address.city;
	info.address = address.address;
	info.zipCode = address.zipCode;
	info.truckManufacturer = "BMW";
	info.truckModel = "530D";
	info.ssn = getDriverSSN(i);
	info.phoneNumber = "1" + info.ssn.replace('-','')
	return info;
}

populateBills = function (message, callback) {

	var i = 6000;
	var j = 0;
	function myLoop(i) {
		setTimeout(function () {
			if(i < 10000 && j < 80000) {
				var messagePromise = _constructMessageDetails(i);
				messagePromise.done(function (message) {
					Bills.generatebill({
						customerSSN: message.customerSSN,
						info: message
					}, function (error) {
						if(error) {
							console.log("Error:" + error);
						} else {
							console.log("Bill generated : " + i);
						}
					});
				}, function (error) {
					console.log(i + " Error generating bill : " + error);
				});
			} else {
				i = 0;
			}
			i++;
			j++;
			myLoop(i);
		}, 150);
	}
	myLoop(i);
/*
	for(var i = 0; i < randomAddresses.length; i++) {
		for(var j = 0; j < randomAddresses.length; j++) {
			var string = randomAddresses[i].city + randomAddresses[j].city;
			string = string.replace(' ','');
			MongoDB.collection("GoogleMaps").insert({
				string: string,
				
			})
		}
	}*/
}

_constructMessageDetails = function (i) {
	var deferred = Q.defer();
	var message = {};
	var customerSSN = getCustomerSSN(i);
	var productPromise = getRandomProduct(Math.abs(9834 - i));
	productPromise.done(function (product) {
		message.product_details = [{
			product_id: product.productID,
			quantity: 2,
			price_per_unit: product.productPrice,
			farmer_id: product.farmerSSN,
			product_name: product.productName,
			product_image_url: product.productImage
		}];
		message.customerSSN = customerSSN;
		message.total_amount = 2 * product.productPrice;
		deferred.resolve(message);
	}, function (error) {
		deferred.reject(error);
	});

	return deferred.promise;
}

getRandomProduct = function (i) {
	var deferred = Q.defer();
	var farmerSSN = getFarmerSSN(i);
	var product = null;
	var cursor = MongoDB.collection("products").find({
		farmerSSN: farmerSSN
	});
	cursor.each(function (error, doc) {
		if(error) {
			deferred.reject(error);
		}
		if(doc != null) {
			product = doc;
		} else {
			if(product == null) {
				deferred.reject("Product not found!");
			} else {
				deferred.resolve(product);
			}
		}

	});
	return deferred.promise;
}

var randomAddresses = [
	{
		address: '495 Manhasset Woods Rd',
		state: 'NY',
		city: 'Manhasset',
		zipCode:'11030-1663'
	},
	{
		address: '524 Dickson St',
		state: 'NY',
		city: 'Endicott',
		zipCode:'13760-4616'
	},{
		address: '6620 S Evans Ave 1st',
		state: 'IL',
		city: 'Chicago',
		zipCode:'60637-4131'
	},{
		address: '7412 Shannon Cir',
		state: 'MN',
		city: 'Edina',
		zipCode:'55439-2627'
	},{
		address: '790 N Main St',
		state: 'OH',
		city: 'Akron',
		zipCode:'44310-3045'
	},{
		address: '2605 12th St',
		state: 'OR',
		city: 'Tillamook',
		zipCode:'97141-4101'
	},{
		address: '19025 Ave Of The Oaks',
		state: 'CA',
		city: 'Santa Clarita',
		zipCode:'91321-1415'
	},{
		address: '200 N Broadway St',
		state: 'IA',
		city: 'Toledo',
		zipCode:'52342-1308'
	},{
		address: '810 Seventh Avenue - 24th Floor',
		state: 'NY',
		city: 'New York',
		zipCode:'10019-5873'
	},{
		address: '2104 Lakehill Ct',
		state: 'TX',
		city: 'Arlington',
		zipCode:'76012-5613'
	},{
		address: '3790 A Dunwoody Rd Ne',
		state: 'GA',
		city: 'Atlanta',
		zipCode:'30319-5104'
	},{
		address: '160 Kaupakalua Rd',
		state: 'HI',
		city: 'Haiku',
		zipCode:'96708-5908'
	},{
		address: '45 Galeon Way',
		state: 'AR',
		city: 'Hot Springs',
		zipCode:'71909-7148'
	},{
		address: '119 Palmetto Way',
		state: 'SC',
		city: 'Bluffton',
		zipCode:'29910-9629'
	},{
		address: '14649 Se 51st Ct',
		state: 'FL',
		city: 'Summerfield',
		zipCode:'34491-4022'
	},{
		address: '7900 N Eldridge Prky',
		state: 'TX',
		city: 'Houston',
		zipCode:'77041'
	},{
		address: '308 Arrowhead Dr',
		state: 'AL',
		city: 'Montgomery',
		zipCode:'36117-4108'
	},{
		address: '1280 Santa Anita Ct',
		state: 'CA',
		city: 'Woodland',
		zipCode:'95776-6128'
	},{
		address: '1245 Orange Ave',
		state: 'NJ',
		city: 'Cranford',
		zipCode:'07016-2054'
	},{
		address: '1004 Nw 113th St',
		state: 'MO',
		city: 'Kansas City',
		zipCode:'64155-1891'
	},{
		address: '164 Wilhelmina Dr',
		state: 'GA',
		city: 'Austell',
		zipCode:'30168-6904'
	},{
		address: '1501 Washington St',
		state: 'IL',
		city: 'Mendota',
		zipCode:'61342-1476'
	},{
		address: 'W61 N631 Meguon Ave',
		state: 'WI',
		city: 'Cedarburg',
		zipCode:'53012'
	},{
		address: '405 N Main St',
		state: 'OH',
		city: 'Ada',
		zipCode:'45810-1023'
	},{
		address: '750 Judy Lane Ext',
		state: 'VA',
		city: 'Stanley',
		zipCode:'22851-4430'
	},{
		address: '24 New England Exec Park',
		state: 'MA',
		city: 'Burlington',
		zipCode:'01803'
	},{
		address: '11 Dickens Pl',
		state: 'AR',
		city: 'Bella Vista',
		zipCode:'72714-4603'
	},{
		address: '210 Annapolis St',
		state: 'MD',
		city: 'Annapolis',
		zipCode:'21401-1312'
	},{
		address: '1 Middle St',
		state: 'NH',
		city: 'Lancaster',
		zipCode:'03584-3340'
	},{
		address: '13125 W 2nd Pl',
		state: 'CO',
		city: 'Lakewood',
		zipCode:'80228-1313'
	},{
		address: '421 Litchfield St',
		state: 'CT',
		city: 'Torrington',
		zipCode:'06790-6660'
	},{
		address: '12813 E Main Ave',
		state: 'WA',
		city: 'Spokane Vly',
		zipCode:'99216-0940'
	},{
		address: '818 W Bellevue St',
		state: 'LA',
		city: 'Opeluasas',
		zipCode:'70570-3432'
	},{
		address: '1610 Powers Run Rd',
		state: 'PA',
		city: 'Pittsburgh',
		zipCode:'15238-2412'
	},{
		address: '201 S 5th St',
		state: 'OK',
		city: 'Kingfisher',
		zipCode:'73750-3203'
	},{
		address: '1054 Coolege St',
		state: 'AL',
		city: 'Wadley',
		zipCode:'36276'
	},{
		address: '1555 Eagle Ridge Rd Ne',
		state: 'NM',
		city: 'Albuquerque',
		zipCode:'87122-1156'
	},{
		address: '3601 Bridger Dr N',
		state: 'IN',
		city: 'Carmel',
		zipCode:'46033-4167'
	},{
		address: '450 Gill Rd',
		state: 'PA',
		city: 'Mifflintown',
		zipCode:'17059-7778'
	},{
		address: '8110 S College Ave',
		state: 'AZ',
		city: 'Tempe',
		zipCode:'85284-1415'
	},{
		address: '4275 Five Oaks Drive',
		state: 'MI',
		city: 'Lansing',
		zipCode:'48911-4248'
	},{
		address: '6360 W 37th St',
		state: 'IN',
		city: 'Indianapolis',
		zipCode:'46224-1102'
	},{
		address: '27463 Butler Rd',
		state: 'MI',
		city: 'Mendon',
		zipCode:'49072-9408'
	},{
		address: '3449 Otto Ave',
		state: 'CA',
		city: 'Alpine',
		zipCode:'91901-1533'
	},{
		address: '5655 Cohn Eaker Rd',
		state: 'NC',
		city: 'Cheeryville',
		zipCode:'28021-9282'
	},{
		address: '117 Eleanor Roosevelt 100 A',
		state: 'PR',
		city: 'San Juan',
		zipCode:'00918'
	},{
		address: '1529 Weatherstone Dr',
		state: 'TX',
		city: 'Desoto',
		zipCode:'75115-5357'
	},{
		address: '2407 1st Ave No 200',
		state: 'WA',
		city: 'Seattle',
		zipCode:'98121-1311'
	},{
		address: '713 Forrest St',
		state: 'WI',
		city: 'Blk River Fls',
		zipCode:'54615-9126'
	},{
		address: '703 Furys Ferry Rd',
		state: 'GA',
		city: 'Evans',
		zipCode:'30809-4254'
	},{
		address: '4026 California Ave',
		state: 'MS',
		city: 'Jackson',
		zipCode:'39213-5513'
	},{
		address: '103 College Dr N Unit 3',
		state: 'ND',
		city: 'Devils Lake',
		zipCode:'58301-2931'
	},{
		address: '10916 Spicewood Ct',
		state: 'CA',
		city: 'San Diego',
		zipCode:'92130-4825'
	},{
		address: '15000 Woodforest Blvd',
		state: 'TX',
		city: 'Channelview',
		zipCode:'77530-3362'
	},{
		address: '11670 Us Highway 64',
		state: 'TN',
		city: 'Somerville',
		zipCode:'38068-6026'
	},{
		address: '526 Atkinson St',
		state: 'KY',
		city: 'Henderson',
		zipCode:'42420-4283'
	},{
		address: '1351 Gates Rd',
		state: 'MS',
		city: 'Columbia',
		zipCode:'39429-8948'
	},{
		address: '323 S Randolph St',
		state: 'IL',
		city: 'Macomb',
		zipCode:'61455-2235'
	},{
		address: '7501 E Thompson Peak Pkwy',
		state: 'AZ',
		city: 'Scottsdale',
		zipCode:'85255-4525'
	}];

getRandomAddress = function () {
	var min = 0;
	var max = randomAddresses.length;
	var random = Math.floor(Math.random() * (max - min + 1)) + min;
	if(!randomAddresses[random]) {
		return randomAddresses[random - 1];
	} else {
		return randomAddresses[random];
	}
}

getDriverSSN = function (i) {
	var ssn = "001-23-";
	if((i >= 1000 && i <= 9999) > 0) {
		ssn += i;
	} else if((i >= 100 && i <= 999)) {
		ssn += "0" + i;
	} else if((i >= 10) && i <= 99) {
		ssn += "00" + i;
	} else {
		ssn += "000" + i;
	}
	return ssn;
}


getFarmerSSN = function (i) {
	var ssn = "002-23-";
	if((i >= 1000 && i <= 9999) > 0) {
		ssn += i;
	} else if((i >= 100 && i <= 999)) {
		ssn += "0" + i;
	} else if((i >= 10) && i <= 99) {
		ssn += "00" + i;
	} else {
		ssn += "000" + i;
	}
	return ssn;
}


getCustomerSSN = function (i) {
	if(i < 27) {
		i = 28;
	}
	var ssn = "003-23-";
	if((i >= 1000 && i <= 9999) > 0) {
		ssn += i;
	} else if((i >= 100 && i <= 999)) {
		ssn += "0" + i;
	} else if((i >= 10) && i <= 99) {
		ssn += "00" + i;
	} else {
		ssn += "000" + i;
	}
	return ssn;
}

/*
*
* 	"productName" : "Product 1",
 "productPrice" : "2.12",
 "description" : "Fresh Produced Product",
 "productImage" : "http://image.com",
 "productID" : "3fda539b8d72a71874f8264c4980287ed5b6bb1a",
 "farmerFirstName" : "Farmer",
 "farmerLastName" : "1",
 "farmerSSN" : "122-45-1245",
 "reviews" : [ ],
 "isApproved" : true,
 "rating" : 3.5,
 "numberOfRatings" : 6
* */


var randomProducts = [{
	productName:'Banana',
	productPrice: 1.98,
	description: 'Organic Bananas',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81apRlvQUrL._SR280,280_.jpg'
},{
	productName:'Bananas',
	productPrice: 1.45,
	description: 'Yellow Bananas',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81xkhIGYHBL._SR280,280_.jpg'
},{
	productName:'Strawberries',
	productPrice: 5.99,
	description: 'Organic Strawberries',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91BCkMnPAhL._SR280,280_.jpg'
},{
	productName:'Avocado',
	productPrice: 1.99,
	description: 'Hass Avocado, Ripe',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81u0TBolABL._SR280,280_.jpg'
},{
	productName:'Blueberries',
	productPrice: 4.99,
	description: 'Organic Blueberries',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/613ZyJ5ACHL._SR280,280_.jpg'
},{
	productName:'Raspberries',
	productPrice: 3.99,
	description: 'Organic Raspberries',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91fAu5XYBuL._SR280,280_.jpg'
},{
	productName:'Baby Carrots',
	productPrice: 2.99,
	description: 'Organic Baby carrots',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/71IEZs7c0xL._SR280,280_.jpg'
},{
	productName:'Cucumber',
	productPrice: 0.99,
	description: 'One medium',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/61l1rfLwieL._SR280,280_.jpg'
},{
	productName:'Grape tomatoes',
	productPrice: 3.99,
	description: 'Organic Grape Tomatoes',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81k4VpqfBRL._SR280,280_.jpg'
},{
	productName:'Lemon',
	productPrice: 0.99,
	description: 'One, Medium',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/61Aqo-ejqKL._SR280,280_.jpg'
},{
	productName:'Eggs',
	productPrice: 5.49,
	description: 'Large Eggs',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81saP2oHaJL._SR280,280_.jpg'
},{
	productName:'Yellow Onion',
	productPrice: 2,
	description: 'One Large',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81Pi5FnoTZL._SR280,280_.jpg'
},{
	productName:'Red Bell Pepper',
	productPrice: 3.09,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81XxHj7yzRL._SR280,280_.jpg'
},{
	productName:'Lime',
	productPrice: 2.32,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/716VT4I5rHL._SR280,280_.jpg'
},{
	productName:'Red Raspberries',
	productPrice: 3.99,
	description: 'Red Raspberries',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91Hg-SW-CLL._SR280,280_.jpg'
},{
	productName:'Broccoli',
	productPrice: 2.3,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81QGukjimmL._SR280,280_.jpg'
},{
	productName:'Red Seedless Grapes',
	productPrice: 2.15,
	description: 'Seedless fresh grapes',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91sYi0JrKKL._SR280,280_.jpg'
},{
	productName:'Fuji Apple',
	productPrice: 2.45,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/71fmKihQdbL._SR280,280_.jpg'
},{
	productName:'Green Onions',
	productPrice: 1.10,
	description: 'Fresh, Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81VJyxeSDcL._SR280,280_.jpg'
},{
	productName:'Red Onion',
	productPrice: 1.25,
	description: 'Fresh Onions',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81dYZnX+0DL._SR280,280_.jpg'
},{
	productName:'Broccoli Crowns',
	productPrice: 2.35,
	description: 'Fresh out of farm',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/81lyGiGFSaL._SR280,280_.jpg'
},{
	productName:'Green Bell Pepper',
	productPrice: 2.34,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/611qfOq07PL._SR280,280_.jpg'
},{
	productName:'Granny Smith Apple',
	productPrice: 3.25,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/718PSM1BNrL._SR280,280_.jpg'
},{
	productName:'Organic Kale',
	productPrice: 2.49,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91lb5DXLmwL._SR280,280_.jpg'
},{
	productName:'Whole white mushrooms',
	productPrice: 5.99,
	description: 'Organic, whole, white',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/61ff03-+dML._SR280,280_.jpg'
},{
	productName:'Beefsteak Tomato',
	productPrice: 2.56,
	description: 'Organic',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/617ewaeQw4L._SR280,280_.jpg'
},{
	productName:'Pear',
	productPrice: 3.45,
	description: 'Bosc Pear',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/71cavE5tXlL._SR280,280_.jpg'
},{
	productName:'Gala Apple',
	productPrice: 4.5,
	description: 'Gala Organic Apple',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/61gzmIezKqL._SR280,280_.jpg'
},{
	productName:'Spinach',
	productPrice: 1.99,
	description: 'One bunch',
	productImage:'https://images-na.ssl-images-amazon.com/images/I/91cp8Zw8mlL._SR280,280_.jpg'
},{
	productName:'Beech Mushrooms',
	productPrice: 3.99,
	description: 'Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/msh_bee_pkg_p.jpg?lastModify=2015-06-11&publishId=2315'
},{
	productName:'Shiitake Mushrooms',
	productPrice: 5.49,
	description: 'Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/msh_org_shi_pkg_p.jpg?lastModify=2016-01-19&publishId=2315'
},{
	productName:'Oyester Mushrooms',
	productPrice: 1.25,
	description: 'Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/msh_oys_pkg_p.jpg?lastModify=2015-06-11&publishId=2315'
},{
	productName:'Okra',
	productPrice: 2.99,
	description: 'Okra, Packaged',
	productImage:'https://www.freshdirect.com/media/images/product/vegetables/specialty/sp_okra_p.jpg?lastModify=2005-05-19&publishId=2315'
},{
	productName:'Serrano Peppers',
	productPrice: 4.79,
	description: 'Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_pep_srnopkg_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Aloe Vera Leaf',
	productPrice: 3.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_pid_2301745_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Bok Choy',
	productPrice: 1.99,
	description: 'Fresh, International quality',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/cab_bockchoy_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Green Plantains',
	productPrice: 1.49,
	description: 'Fresh, Green',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/fru_dmy_ea_30233_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Green Beans',
	productPrice: 1.99,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_bns_grnlb_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Hebanero Peppers',
	productPrice: 2.49,
	description: 'Fresh, Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_pep_hbnropkg_p.jpg?lastModify=2014-03-03&publishId=2315'
},{
	productName:'Horseradish',
	productPrice: 2.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/rt_horse_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Jalapeno Peppers',
	productPrice: 2.99,
	description: 'Fresh, Organic',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/pep_jalap_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Kabocha Squash',
	productPrice: 3.99,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/vegetables/squash/sq_hrd_kaboch_p.jpg?lastModify=2007-10-22&publishId=2315'
},{
	productName:'Lemongrass',
	productPrice: 2.79,
	description: 'Fresh Lemongrass',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/hrb_lgrass_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Cilantro',
	productPrice: 1.99,
	description: 'Organic Cilantro',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/orghrb_cilantro_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Mint',
	productPrice: 1.49,
	description: 'Organic Mint',
	productImage:'https://www.freshdirect.com/media/images/product/vegetables/herbs/hrb_mint_p.jpg?lastModify=2005-05-19&publishId=2315'
},{
	productName:'Red Cabbage',
	productPrice: 3.49,
	description: 'Organic Red Cabbage',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/orgveg_cbbg_red_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Snow Peas',
	productPrice: 2.59,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/pea_snow_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Turmeric root',
	productPrice: 5.99,
	description: 'Dried',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_pid_2301885_p.jpg?lastModify=2015-07-10&publishId=2315'
},{
	productName:'Thai Peppers',
	productPrice: 3.68,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/veg_1/veg_pep_thaichpkg_p.jpg?lastModify=2015-10-20&publishId=2315'
},{
	productName:'Savani Farms',
	productPrice: 3.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/fru_trop_indmango_p.jpg?lastModify=2015-06-01&publishId=2315'
},{
	productName:'Apricots',
	productPrice: 4.79,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/apricot_orng_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Francine Mangoes',
	productPrice: 2.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/trp_mango_fran_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Rambutan',
	productPrice: 3.39,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/fru_trp_rambutan_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Red Cherries',
	productPrice: 4.45,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/specialty_10/chrry_red_p.jpg?lastModify=2014-12-17&publishId=2315'
},{
	productName:'Golden Pineapple',
	productPrice: 2.45,
	description: 'Golden',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/trp_pineapple_gldnrp_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Papaya',
	productPrice: 3.99,
	description: 'Mini solo Papaya',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/fru_pid_2210504_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Grapefruit',
	productPrice: 4.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/gpft_pink_or_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Passion Fruit',
	productPrice: 2.39,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/product/fruit_2/trp_passionfruit_p.jpg?lastModify=2016-04-26&publishId=2315'
},{
	productName:'Beef',
	productPrice: 8.99,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_beef_p.jpg?lastModify=2014-01-27'
},{
	productName:'Chicken',
	productPrice: 7.99,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_chicken_p.jpg?lastModify=2014-01-27'
},{
	productName:'Lamb',
	productPrice: 4.98,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_lamb_p.jpg?lastModify=2014-01-27'
},{
	productName:'Pork',
	productPrice: 9.39,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_pork_p.jpg?lastModify=2014-01-27'
},{
	productName:'Turkey',
	productPrice: 9.99,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_turkey_p.jpg?lastModify=2014-01-27'
},{
	productName:'Veal',
	productPrice: 4.49,
	description: 'Fresh',
	productImage:'https://www.freshdirect.com/media/images/navigation/department/meat/meat_cat/mea_veal_p.jpg?lastModify=2012-01-26'
}];