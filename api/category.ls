html-encode = require \html-escape

module.exports = (app, mariaPool) ->
  reqLoad = app.mods.reqLoad
  regexs = app.mods.regexs
  resp = app.mods.res

  app.get \/api/category/item, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    type = req.query.t

    # 查詢分類(判斷重複或是以 keyword 查詢或是 ctid 或是 aid)

    switch type
    case \exist
      # 分類是否已存在
      sql = 'SELECT * FROM category WHERE name LIKE ?;'
      name = req.query.name
      if name and name.match regexs.name
        (err, rows, fields) <- mariaPool.query sql, [name]
        throw err if err
        
        if rows.length
          resp.success res, rows[0]
        else
          resp.fail res, {}
      else
        resp.fail res, {}
 
    case \query
      sql = '
        SELECT c.ctid, c.name, c.abstract, COUNT(ac.aid) AS num 
        FROM category c 
        LEFT JOIN article_category ac ON(c.ctid=ac.ctid) 
        GROUP BY ctid 
        ORDER BY ctid DESC;
      '
      (err, rows, fields) <- mariaPool.query sql
      throw err if err
      resp.success res, rows

    case \query_kw
      # 以 keyword 查詢
      sql = 'SELECT * FROM category WHERE name LIKE ? OR abstract LIKE ?;'

      kw = \% + req.query.keywd + \%

      if kw
        (err, rows, fields) <- mariaPool.query sql, [kw, kw]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    case 'query_ctid'
      # 以 ctid 查詢
      sql = "SELECT * FROM category WHERE ctid=?;"

      ctid = req.query.ctid
      if parseInt ctid
        (err, rows, fields) <- mariaPool.query sql, [ctid]
        throw err if err

        if rows.length
          resp.success res, rows[0]
        else
          resp.fail res, {}
      else 
        resp.fail res, {}

    case \query_aid
      # 以 aid 查詢
      sql = 'SELECT * FROM category WHERE ctid=(SELECT ctid FROM article_category WHERE aid=?);'

      aid = req.query.aid
      if parseInt aid
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    default
      resp.fail res, {}

  app.post \/api/category/item, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    name = req.body.name
    abstract = html-encode req.body.abstract

    sql = 'SELECT * FROM category WHERE name LIKE ?;'

    if name and abstract and req.session.manager
      (err, rows, fields) <- mariaPool.query sql, [name]
      throw err if err

      if !rows.length
        sql = 'INSERT INTO category VALUES(NULL, ?, ?);'

        (err, rows, fields) <- mariaPool.query sql, [name, abstract]
        throw err if err
        resp.success res, ctid: rows.insertId
      else
        resp.fail res, {}
    else
      resp.fail res, {}