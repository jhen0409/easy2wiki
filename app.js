if (!require('fs').existsSync('config.json')) {
	console.log('not found config.json.');
	return;
}

var express = require('express'),
	app = express(),
	config = require('./config'),
	api = require('./api'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	mysql = require('mysql'),		// MariaDB
	redis = require('redis'),
	webRedisStore = require('connect-redis')(session);

// redis config
var redisHost = config.redis_host,
	redisPort = config.redis_port,
	redisDB = 0,
	// redisPass = 'pass',
	// redis pub, sub, store
	pub = redis.createClient(redisPort, redisHost),
	sub = redis.createClient(redisPort, redisHost),
	store = redis.createClient(redisPort, redisHost);

// mariadb config & mariadb connection pool
var mariaPool = mysql.createPool({
	connectionLimit: 10,
	host: config.mysql_host,
	database: config.mysql_dbname,
	user: config.mysql_username,
	password: config.mysql_password
});

mariaPool.on('connection', function(connection) {
  connection.query("SET names 'utf8'");
});

// express
app.set('redisPub', pub);
app.set('redisSub', sub);
app.set('redisStore', store);

app.use(bodyParser());
app.use(cookieParser());
app.use(session({
	secret: 'test_e2w',
	store: new webRedisStore({
			host: redisHost,
			port: redisPort,
			db: redisDB
			//pass: redisPass
		}),
	key: 'sid',
	cookie: { maxAge: new Date(Date.now() + (60 * 1000 * 60 * 24)) }
}));
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

api(app, mariaPool);	// api use express app & io & mariadb connection pool

app.use(function(req, res, next){
  res.json({ "status": 200, data: {} });		// fail status
});

app.listen(3000);
