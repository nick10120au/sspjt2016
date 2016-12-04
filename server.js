var http = require('http');
var url  = require('url');
var MongoClient = require('mongodb').MongoClient; 
var assert = require('assert');
var mongourl = 'mongodb://test:test@ds111788.mlab.com:11788/ssproject';
var ObjectID = require('mongodb').ObjectID;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var session = require('express-session');
var fileUpload = require('express-fileupload');
var watson = require('watson-developer-cloud');

var SECRETKEY = 'BTSBTSBTSBTS';

app.use(express.static(__dirname + '/public'));




app.use(function(req, res, next){ 
	console.log('Time', Date.now(), req.method, req.path);
	res.header("Access-Control-Allow-Origin","*");
	res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});


app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({
	secret: SECRETKEY,
	resave: true,
	saveUninitialized: true
}));

app.set('view engine', 'ejs');


app.get('/api/read/name/:name', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);	
		find1Restaurant(db,{name:req.params.name}, function(result) {
			assert.equal(null, err);
			res.json(result);
			res.end();
			db.close();
		});
	});
});

app.get('/api/read/borough/:borough', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);	
		find1Restaurant(db,{borough:req.params.borough}, function(result) {
			assert.equal(null, err);
			res.json(result);
			res.end();
			db.close();
		});
	});
});

app.get('/api/read/cuisine/:cuisine', function(req, res) {
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);	
		find1Restaurant(db,{cuisine:req.params.cuisine}, function(result) {
			assert.equal(null, err);
			res.json(result);
			res.end();
			db.close();
		});
	});
});

app.get('/read', function(req, res, next) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{ 
		var resultArray = [];
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(null, err);
			var cursor = db.collection('restaurants').find();
			cursor.forEach(function(doc, err) {
				assert.equal(null, err);
				resultArray.push(doc);
			}, function() {
				db.close();
				var user = req.session.username;
				res.render('list', {r: resultArray,user: user});
			});
		});
	}
});

app.post('/read', function(req, res) {
	var searchArray = [];
	if (req.body.option == "sname"){
		var criteria = {name:req.body.sinput};
	};
	if (req.body.option == "sborough"){
		var criteria = {borough:req.body.sinput};
	};
	if (req.body.option == "scuisine"){
		var criteria = {cuisine:req.body.sinput};
	}
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);
		var cursor = db.collection('restaurants').find(criteria);
		cursor.forEach(function(doc, err) {
			assert.equal(null, err);
			searchArray.push(doc);
		}, function() {
			db.close();
			var user = req.session.username;
			res.render('list', {r: searchArray,user: user});
			console.log(searchArray);
		});
	});
});

app.get('/showdetails', function(req, res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err, null);
			console.log('Connected MongoDB\n');
			var criteria = {"_id": ObjectID(req.query.id)};
			find1Restaurant(db,criteria,function(restaurants) {
				db.close();
				console.log('Disconnected MongoDB\n');
				console.log(restaurants);
				res.render('showDetail', {r: restaurants});
				res.end();
			});
		});
	}
});
function find1Restaurant(db,criteria,callback) {
	db.collection('restaurants').findOne(criteria,function(err, result) {
		assert.equal(err,null);	
		callback(result);
	});
}

app.get('/newRest', function(req, res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		res.sendFile(__dirname + '/public/restaurant.html');
	}
});

	
app.post('/newRest', function(req, res) {
	var r = {};  // new restaurant to be inserted
	r['address'] = {};
	r.address.street = (req.body.street != null) ? req.body.street : null;
	r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
	r.address.building = (req.body.building != null) ? req.body.building : null;
	r.address['coord'] = [];
	r.address.coord.push(req.body.lon);
	r.address.coord.push(req.body.lat);
	r['borough'] = (req.body.borough != null) ? req.body.borough : null;
	r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
	r['name'] = (req.body.name != null) ? req.body.name : null;
	r['rate'] = [];
	if (req.files) {	
		r['photo'] = new Buffer(req.files.photo.data).toString('base64');
		r['mimetype'] = req.files.photo.mimetype;
	}
	r.createby = req.session.username;
	console.log(req.files);
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').insert(r,
			function(err,result) {
				console.log(result);
				assert.equal(err,null);
				console.log('Disconnected from MongoDB\n');
				res.redirect('/read');
				db.close();
			});
	});
});

app.post('/api/create', function(req, res) {
	var r = {};  // new restaurant to be inserted
	r['address'] = {};
	r.address.street = (req.body.street != null) ? req.body.street : null;
	r.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
	r.address.building = (req.body.building != null) ? req.body.building : null;
	r.address['coord'] = [];
	r.address.coord.push(req.body.lon);
	r.address.coord.push(req.body.lat);
	r['borough'] = (req.body.borough != null) ? req.body.borough : null;
	r['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
	r['name'] = (req.body.name != null) ? req.body.name : null;
	r['rate'] = [];	
	r['photo'] = null;
	r['mimetype'] = null;
	r['createby'] = null;
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		db.collection('restaurants').insert(r, function(err,result) {
				assert.equal(err,null);
				if(err) {
					res.json(result);
				}else{	
					res.json(result);			
					db.close();
				}
			});
	});
});
	

app.get('/edit', function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{	
		if(req.session.username == req.query.createby) {
			var id = req.query.id;
			var borough = req.query.borough;
			var cuisine = req.query.cuisine;
			var street = req.query.street;
			var building = req.query.building;
			var zipcode = req.query.zipcode;
			var lat = req.query.lat;
			var lon = req.query.lon;
			var name = req.query.name;
			var rate = req.query.rate;
	
			console.log("passingvalue");
			console.log(rate);	
			res.render('edit', {id:id, borough:borough, cuisine:cuisine, street:street, building:building, 
						zipcode:zipcode, lat:lat, lon:lon, name:name, rate:rate});
		}else{
			res.write("<html><body>");
			res.write('Not authorized<br>');
			res.write("<a href=\"javascript:history.back()\">Go back.</a>");
			res.write("</html></body>");
		}
	}
});


app.post('/edit', function(req, res) {
	var e = {};  // new restaurant to be inserted
	e['address'] = {};
	e.address.street = (req.body.street != null) ? req.body.street : null;
	e.address.zipcode = (req.body.zipcode != null) ? req.body.zipcode : null;
	e.address.building = (req.body.building != null) ? req.body.building : null;
	e.address['coord'] = [];
	e.address.coord.push(req.body.lon);
	e.address.coord.push(req.body.lat);
	e['borough'] = (req.body.borough != null) ? req.body.borough : null;
	e['cuisine'] = (req.body.cuisine != null) ? req.body.cuisine : null;
	e['name'] = (req.body.name != null) ? req.body.name : null;
	if (req.files.photo.data != "") {
		e['photo'] = new Buffer(req.files.photo.data).toString('base64');
		e['mimetype'] = req.files.photo.mimetype;
	}
	var criteria = {"_id":ObjectID(req.body.id)};
	var item = {'$set':e};	
	
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		db.collection('restaurants').update(criteria,item, function(err,result) {
			assert.equal(err,null);
			console.log("Update was successful");	
			db.close();
			console.log('Disconnected from MongoDB\n');
			res.redirect('/showDetails?id='+req.body.id);				
		});
	});
});


app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		res.redirect('/read');
	}
});

app.get('/login',function(req,res) {
	res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', function(req,res) {
	MongoClient.connect(mongourl, function(err, db) {
		console.log('connected');
		if(err){
			throw err;
		}else{
			db.collection('user').findOne({name:req.body.name,pwd:req.body.password}, function(err, user) {
				assert.equal(err,null);
				console.log('connected');
				if(user){
					req.session.authenticated = true;
					req.session.username = req.body.name;
					res.redirect('/read');
					db.close();
				}else{
					res.write("<html><body>");
					res.write("Username or Password not correct!<br>");
					res.write("<a href=\"/login\">Go back.</a>");
					res.write("</html></body>");
					console.log('not success');
				}
			});
		}
	});
});

app.get('/logout', function(req,res) {
	req.session.destroy();
	res.redirect('/login');
});


app.get('/register', function(req,res) {
	res.sendFile(__dirname + '/public/register.html');
});

app.post('/register', function(req,res) {
	if(req.body.pw1 != req.body.pw2){
		res.write("<html><body>");
		res.write("Password not correct!<br>");
		res.write("<a href=\"/register\">Go back.</a>");
		res.write("</html></body>");
	}else{
		MongoClient.connect(mongourl, function(err, db) {
			console.log('connected');
			if(err){
				throw err;
			}else{
				db.collection('user').insert({name:req.body.name, pwd:req.body.pw1}, function(err,result) {
					assert.equal(err,null);
					db.close();
					console.log('Disconnected from MongoDB\n');
					res.redirect('/login');
				});
			}
		});
	}
});

app.get('/rate', function(req,res) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		var criteria = {"_id":ObjectID(req.query.id), "rate": {'$elemMatch':{"ppl":req.session.username}}};
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(null, err);
			find1Restaurant(db,criteria,function(rest) {			
				console.log(rest);
      				if (rest != null) {
					res.write("<html><body>");
					res.write("You have rated this restaurant!<br>");
					res.write("<a href=\"javascript:history.back()\">Go back.</a>");
					res.write("</body></html>");
					db.close();			
					console.log('Disconnected from MongoDB\n');
					res.end();
				}else{
					var id = req.query.id;
					console.log(id);
					res.render('rate',{id:id});
					db.close();	
				}
			});
		});
	}
});

app.post('/rate', function(req,res) {
	var criteria = {"_id":ObjectID(req.body.id)};
	console.log(criteria);
	var item = {$push:{"rate":{"ppl":req.session.username, "score":req.body.score}}};
	MongoClient.connect(mongourl, function(err, db) {
		assert.equal(null, err);
		db.collection('restaurants').update(criteria,item, function(err, result) {
      			assert.equal(null, err);
      			console.log('Item updated');
                 	console.log(result);
			db.close();
			console.log('Disconnected from MongoDB\n');
			res.redirect("/showDetails?id="+req.body.id);
		});
	});
});

app.get('/delete', function(req, res, next) {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}else{
		MongoClient.connect(mongourl, function(err, db) {
			if (req.session.username == req.query.createby) {
				db.collection('restaurants').deleteOne({"_id": ObjectID(req.query.id)}, function(err, result) {
      					assert.equal(null, err);
      					console.log('Item deleted');
					res.redirect('/read');
				});
			}else{
				res.write("<html><body>");
				res.write('Not authorized!<br>');
				res.write("<a href=\"javascript:history.back()\">Go back.</a>");
				res.write("</html></body>");
			}
			db.close();
		});
	}
});


app.get("/map", function(req,res) {
                //decode the geohash with geohash module
		var name = req.query.name;
		console.log("name : " + req.query.name);

		var lat  = req.query.lat;
		console.log("lat : " + lat);

		var lon  = req.query.lon;
		console.log("lon : " + lon);

		res.render("gmap.ejs", {name:name, lat:lat, lon:lon});
		res.end();
});


var port = (process.env.VCAP_APP_PORT || 8099);
var host = (process.env.VCAP_APP_HOST || 'localhost');

app.listen(port, host, function() {
	console.log('Server running...');
});
