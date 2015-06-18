if !require \fs .existsSync \config.json
  console.log 'not found config.json.'
  return

require! {
  express
  \cookie-parser
  \body-parser
  \express-session
  \connect-redis
  mysql  # MariaDB
  redis
  \./config
  \./api
}

app = express!
RedisStore = connect-redis express-session

# redis config
redisHost = config.redis_host
redisPort = config.redis_port
redisDB = 0
# redisPass = 'pass'
# redis pub, sub, store
pub = redis.createClient redisPort, redisHost
sub = redis.createClient redisPort, redisHost
store = redis.createClient redisPort, redisHost

# mariadb config & mariadb connection pool
mariaPool = mysql.createPool do
  connectionLimit: 10
  host: config.mysql_host
  database: config.mysql_dbname
  user: config.mysql_username
  password: config.mysql_password

mariaPool.on \connection, (connection) ->
  connection.query "SET names 'utf8'"

# express
app.set 'redisPub', pub
app.set 'redisSub', sub
app.set 'redisStore', store

app.use bodyParser!
app.use cookieParser!
app.use express-session do
  secret: 'test_e2w'
  store: new RedisStore do
    host: redisHost
    port: redisPort
    db: redisDB
    # pass: redisPass
  key: 'sid'
  cookie: maxAge: new Date Date.now! + (60 * 1000 * 60 * 24)

app.use express.static __dirname + \/public

app.use (req, res, next) ->
  console.log "#{req.method} #{req.url}"
  next!

api app, mariaPool  # api use express app & io & mariadb connection pool

app.use (req, res, next) ->
  res.json status: 200, data: {} # fail status

app.listen 3000