var fs = require('fs-extra'),
	open = require('open'),
	express = require('express'),
	bodyParser = require('body-parser'),
	app = express(),
	mysql = require('mysql'),
	redis = require('redis'),
	ejs = require('ejs'), 
	path = require("path"),
	htmlEncode = require("html-escape");

var templates = [
	'index',
	'login',
	'item_new',
	'item_view',
	'item_edit',
	'item_list',
	'item_diff',
	'item_modify_record',
	'category_list',
	'category_new'
];

function convertTemplates(opts, cb) {
	var tdir = __dirname + '/setup/template';
	var dir = __dirname + '/public';

	if (fs.existsSync(dir)) {
		fs.removeSync(dir);
	}

	fs.copy(tdir, dir, function(err){
  	if (err) return console.error(err);
  	
  	templates.forEach(function(e) {
			var file = __dirname + '/public/' + e + '.ejs';
			var toFile = __dirname + '/public/' + e + '.html';

			var data = fs.readFileSync(file, 'utf-8');
			var html = ejs.render(data, {
				wiki_name: opts.wiki_name,
				license: opts.license
			});

			fs.outputFileSync(toFile, html);
			fs.remove(file);
		});
  	cb();

	});
}

function outputConfig(opts) {
	var file = __dirname + '/config.json';
	fs.outputJsonSync(file, opts);
}

function mysqlCheck(opts, cb) {
	var connection = mysql.createConnection({
		host: opts.mysql_host,
		port: opts.mysql_port,
		user: opts.mysql_username,
		password: opts.mysql_password,
		multipleStatements: true
	});

	connection.connect(function(err) {
		if (err) {
			cb(0);
			return;
		}

		var sqlejs = fs.readFileSync(__dirname + '/setup/e2w.sql.ejs', 'utf-8');

		var sql = ejs.render(sqlejs, {
			db_name: opts.mysql_dbname
		});

		connection.query(sql, function(err) {
			if (err) throw err;
				
			var sql = 'INSERT INTO manager VALUES(NULL, ?, ?, ?)';

			connection.query(sql, [opts.manager_username, opts.manager_password, opts.manager_name], function(err) {
				if (err) throw err;

				cb(1);
			});
		});
	});
}

function redisCheck(opts, cb) {
	var client = redis.createClient(opts.redis_port, opts.redis_host);
		
	client.on("connect", function () {
    cb(1);
    client.end();
  });

  client.on("error", function () {
    cb(0);
    client.end();
  });
}

function emailCheck(opts) {
	var regex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})*$/g;
	return !!opts.manager_email.match(regex);
}

function response(res, status) {
	res.json({ status: status });
}

var configFile = __dirname + '/config.json';

fs.exists(configFile, function (exists) {
  if (!exists) {

  	app.use(express.static(__dirname + '/setup'));
  	app.use(bodyParser());

  	// app.get('/check_config', function(req, res) {});

		app.post('/install', function(req, res) {

			var opts = {
				mysql_host: req.body.mysql_host, 
				mysql_port: req.body.mysql_port, 
				mysql_dbname: req.body.mysql_dbname, 
				// mysql_dbcommit: req.body.mysql_dbcommit, 
				mysql_username: req.body.mysql_username,
				mysql_password: req.body.mysql_password,
				redis_host: req.body.redis_host, 
				redis_port: req.body.redis_port, 
				// logo_file: req.body.logo_file, 
				wiki_name: req.body.wiki_name, 
				// edit_permissions: req.body.edit_permissions, 
				license: req.body.license, 
				manager_username: req.body.manager_username, 
				manager_password: req.body.manager_password, 
				manager_name: req.body.manager_name
				// manager_email: req.body.manager_email
			};

			var b = 1;
			for (var k in opts) {
				if (!opts[k] || opts[k] != htmlEncode(opts[k])) {
					b = 0;
				}
			}

			if (b) {
				redisCheck(opts, function(status) {
					if (status) {
						mysqlCheck(opts, function(status) {
							if (status) {
								convertTemplates(opts, function() {

									delete opts.manager_username;
									delete opts.manager_password;
									delete opts.manager_name;

									outputConfig(opts);
									response(res, 100);

									setTimeout(function() {
										console.log('success.');
										process.exit();
									}, 1000);
								});
							} else {
								console.log('mysql err.');
								response(res, 200);
							}
						});
					} else {
						console.log('redis err.');
						response(res, 200);
					}
				});
			} else {
				console.log('input err.');
				response(res, 200);
			}
		});
		
		app.listen(8000);
		
		console.log('open http://127.0.0.1:8000/setup.html');
		open('http://127.0.0.1:8000/setup.html');
  } else {
  	console.log('config.json already exists.');
  }
});
