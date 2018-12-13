/*eslint no-console: 0, no-shadow: 0, new-cap: 0, quotes: 0, no-unused-vars: 0*/

var express = require("express");
var app = express();

var xsenv = require("@sap/xsenv");
var hdbext = require("@sap/hdbext");

var hanaOptions = xsenv.getServices({
	hana: {
		tag: "hana"
	}
});
app.use(
	hdbext.middleware(hanaOptions.hana)
);

app.get('/', function(req, res) {
	res.type("text/html").status(200).send(
		'<html><head></head><body><a href="/database">Database</a><br/><a href="/session">Session</a><br/><a href="/insert">Insert</a><br/><a href="/select">Select</a><br/></body></html>'
	);
});

app.get('/database', function(req, res) {
	req.db.exec('select SYSTEM_ID, DATABASE_NAME, HOST, VERSION, USAGE from M_DATABASE', function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/session', function(req, res) {
	req.db.exec('select SESSION_USER, CURRENT_SCHEMA from DUMMY', function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

app.get('/insert', function(req, res) {
	var sql = 'insert into "fs-mta-db::tables.MyTable" ("created") values(?)';
	var ts = new Date().toISOString();
	req.db.prepare(sql, function(err, statement) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		statement.exec([ts], function(err, results) {
			if (err) {
				res.type("text/plain").status(500).send("ERROR: " + err.toString());
			} else {
				res.status(200).json(results);
			}
		});
	});
});

app.get('/select', function(req, res) {
	req.db.exec('select * from "db::tables.MyTable"', function(err, results) {
		if (err) {
			res.type("text/plain").status(500).send("ERROR: " + err.toString());
			return;
		}
		res.status(200).json(results);
	});
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
	console.info("Listening on port: " + port);
});