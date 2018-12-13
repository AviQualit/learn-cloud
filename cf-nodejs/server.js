var express = require('express');
var app = express();
var request = require("request");
var async = require("async");
var https = require("https");
var cfenv = require("cfenv");
var appEnv = cfenv.getAppEnv();
var hanaCredentials = appEnv.getServiceCreds('Products1-Products1-hdi-container-6Wmpzc5W1E6u5Gaj');

var hdbext = require("@sap/hdbext");

app.use(
	hdbext.middleware(hanaCredentials)
);

app.get('/', function (req, res) {
	res.type("text/html").status(200).send(
		'<html><head></head><body><a href="/database">Database</a><br/><a href="/session">Session</a><br/><a href="/create">Create</a><br/><a href="/insert">Insert</a><br/><a href="/select">Select</a><br/><a href="/drop">Drop</a></body></html>'
	);
});

app.get('/database', function (req, res) {
	req.db.exec('select SYSTEM_ID, DATABASE_NAME, HOST, VERSION, USAGE from M_DATABASE', function (err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/session', function (req, res) {
	req.db.exec('select SESSION_USER, CURRENT_SCHEMA from DUMMY', function (err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/create', function (req, res) {
	req.db.exec('create table MYTABLE (MYVALUE double)', function (err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/insert', function (req, res) {
	/////

	var client = req.db;

	async.waterfall([
		function readFromQuandl(callback) {
			var agentOptions;
			var agent;

			agentOptions = {
				host: "services.odata.org",
				port: 443,
				path: "/V3/Northwind/Northwind.svc/Products?$format=json&$select=ProductID,ProductName,UnitsInStock",
				rejectUnauthorized: false
			};

			agent = new https.Agent(agentOptions);

			request({
				url: "https://services.odata.org/V3/Northwind/Northwind.svc/Products?$format=json&$select=ProductID,ProductName,UnitsInStock",
				method: "GET",
				agent: agent
			}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					console.log("OK STATUSSSSSSSSSSSSSSSSSSS");
					var obj = JSON.parse(body);

					var answer = obj.value.map(function (el) {
						var arr = [];
						for (var key in el) {
							arr.push(el[key]);
						}
						return arr;
					});
					callback(null, answer);
				} else {
					console.log(error.toString());
					callback(error);
				}
			});
		},
		function prepare(body, callback) {
			var arr = [];
			arr = body;

			client.prepare("INSERT INTO  MY_APP_PRODUCTS VALUES(?,?,?)",
				function (err, statement) {
					callback(null, err, arr, statement);
				});

		},

		function execute(err, body, statement, callback) {
			statement.exec(body, function (execErr, results) {
				callback(null, execErr, results);
			});
		},
		function response(err, results, callback) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
				return;
			} else {
				var result = JSON.stringify({
					Objects: results
				});
				res.type("application/json").status(200).send(result);
			}
			callback();
		}
	]);
});

//////////

app.get('/select', function (req, res) {
	req.db.exec('select MYVALUE from MYTABLE', function (err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/drop', function (req, res) {
	req.db.exec('drop table MYTABLE', function (err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
	console.info("Listening on port: " + port);

});