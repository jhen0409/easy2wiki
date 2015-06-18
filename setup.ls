require! {
  \fs-extra : fs
  open
  express
  \body-parser
  mysql
  redis
  ejs
  path
  \html-escape : html-encode
}

app = express!

templates = [
  \index
  \login
  \item_new
  \item_view
  \item_edit
  \item_list
  \item_diff
  \item_modify_record
  \category_list
  \category_new
]

function convertTemplates opts, cb
  tdir = __dirname + \/setup/template
  dir = __dirname + \/public

  fs.removeSync dir if fs.existsSync dir

  (err) <- fs.copy tdir, dir
  return console.error err if err
  
  templates.forEach (e) ->
    file = "#{__dirname}/public/#{e}.ejs"
    toFile = "#{__dirname}/public/#{e}.html"

    data = fs.readFileSync file, \utf-8
    html = ejs.render do
      data
      wiki_name: opts.wiki_name
      license: opts.license

    fs.outputFileSync toFile, html
    fs.remove file
  cb!

function mysqlCheck opts, cb
  connection = mysql.createConnection do
    host: opts.mysql_host
    port: opts.mysql_port
    user: opts.mysql_username
    password: opts.mysql_password
    multipleStatements: true

  (err) <- connection.connect
  return cb 0 if err

  sqlejs = fs.readFileSync __dirname + \/setup/e2w.sql.ejs, \utf-8

  sql = ejs.render do
    sqlejs
    db_name: opts.mysql_dbname

  (err) <- connection.query sql
  throw err if err
        
  sql = 'INSERT INTO manager VALUES(NULL, ?, ?, ?)'

  (err) <- connection.query sql, [opts.manager_username, opts.manager_password, opts.manager_name]
  throw err if err
  cb 1

function outputConfig opts
  file = __dirname + \/config.json
  fs.outputJsonSync file, opts

function redisCheck opts, cb
  client = redis.createClient opts.redis_port, opts.redis_host    
  client.on \connect, ->
    cb 1
    client.end!

  client.on \error, ->
    cb 0
    client.end!

function emailCheck opts
  regex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4})*$/g
  !!opts.manager_email.match regex

function response res, message, status
  console.log message
  res.json message: message, status: status

configFile = __dirname + \/config.json

fs.exists configFile, (exists) ->
  return console.log 'config.json already exists.' if exists
  
  app.use express.static __dirname + \/setup
  app.use body-parser!

  # app.get \/check_config, (req, res) ->

  app.post \/install, (req, res) ->

    opts = do
      mysql_host: req.body.mysql_host
      mysql_port: req.body.mysql_port
      mysql_dbname: req.body.mysql_dbname
      # mysql_dbcommit: req.body.mysql_dbcommit
      mysql_username: req.body.mysql_username
      mysql_password: req.body.mysql_password
      redis_host: req.body.redis_host
      redis_port: req.body.redis_port
      # logo_file: req.body.logo_file
      wiki_name: req.body.wiki_name
      # edit_permissions: req.body.edit_permissions
      license: req.body.license
      manager_username: req.body.manager_username
      manager_password: req.body.manager_password
      manager_name: req.body.manager_name
      # manager_email: req.body.manager_email

    b = 1
    Object.keys(opts).forEach (k) ->
      if !opts[k] or opts[k] is not html-encode opts[k]
        b = 0

    return response res, 'input err.', 200 if !b

    # check redis
    (status) <- redisCheck opts
    return response res, 'redis err.', 200 if !status

    # check mysql
    (status) <- mysqlCheck opts
    return response res, 'mysql err.', 200 if !status

    <- convertTemplates opts
    delete opts.manager_username
    delete opts.manager_password
    delete opts.manager_name

    outputConfig opts
    res.json status: 100

    # exit
    <- setTimeout _, 1000
    console.log \success.
    process.exit!
          
  app.listen 8000
  console.log 'open http://127.0.0.1:8000/setup.html'

  open \http://127.0.0.1:8000/setup.html