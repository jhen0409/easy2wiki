require! {
  async
  \html-escape : html-encode
}

module.exports = (app, mariaPool) ->
  reqLoad = app.mods.reqLoad
  regexs = app.mods.regexs
  resp = app.mods.res

  app.get \/api/article/item, (req, res) ->
    # reqLoad mariaPool, req, res, ->

    type = req.query.t

    switch type
    case \exist
      # 條目是否已存在(新增條目時要比對)
      sql = 'SELECT * FROM article WHERE name like ?;'

      name = req.query.name
      if name and name.match regexs.name
        (err, rows, fields) <- mariaPool.query sql, [name]
        throw err if err
        
        if !rows.length
          resp.success res, rows[0]
        else
          resp.fail res, {}
      else
        resp.fail res, {}

    case \query
      # 查詢前 n 筆資料
      sql = '
        SELECT aid, name, abstract, pid, is_manager,  timestamp 
        FROM article ORDER BY timestamp DESC LIMIT ?,?;
      '

      ind = parseInt req.query.ind
      count = parseInt req.query.count

      ind = 0 if !ind
      count = 10 if !count

      (err, rows, fields) <- mariaPool.query sql, [ind, count]
      throw err if err
      resp.success res, rows

    case \query_kw
      # 以 keyword 查詢
      sql = '
      	SELECT aid, name, abstract, pid, is_manager, timestamp 
        FROM article WHERE name LIKE ? OR content LIKE ? OR abstract LIKE ?;
      '

      kw = '%' + req.query.keywd + '%';

      if kw
        (err, rows, fields) <- mariaPool.query sql, [kw, kw, kw]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    case \query_aid
      # 以 aid 查詢
      sql = 'SELECT * FROM article WHERE aid=?;'

      aid = req.query.aid
      if parseInt aid
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err

        if rows.length
          result = rows[0]

          # 查詢分類標記
          sql = '
          	SELECT * FROM category WHERE ctid in 
            (SELECT ctid FROM article_category WHERE aid=?);
          '

          (err, rows, fields) <- mariaPool.query sql, [aid]
          throw err if err
          result.categorys = rows
          resp.success res, result
        else
          resp.fail res, {}
      else
        resp.fail res, {}

    case \query_ctid
      # 以 ctid 查詢
      sql = '
      	SELECT aid,name,abstract,pid,is_manager,timestamp FROM article 
        WHERE aid in (SELECT aid FROM article_category WHERE ctid=?);
      '

      ctid = req.query.ctid

      if parseInt ctid
        (err, rows, fields) <- mariaPool.query sql, [ctid]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

  app.post \/api/article/item, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    name = req.body.name
    abstract = html-encode req.body.abstract
    content = html-encode req.body.content
    ctids = req.body.ctids

    b = 1
    if typeof ctids is 'array'
      ctids.forEach (e) -> b = 0 if typeof e is not \number

    if b and name and name.match regexs.name and abstract and content

      # 判斷名稱重複
      sql = 'SELECT * FROM article WHERE name like ?;'

      (err, rows, fields) <- mariaPool.query sql, [name]
      throw err if err

      if !rows.length
        # 新增
        sql = "INSERT INTO article VALUES(NULL, ?, ?, ?, ?, ?, ?);"

        pid = req.session.manager or req.session.guest
        isManager = if req.session.manager then 1 else 0
        timestamp = Date.now!

        (err, rows, fields) <- mariaPool.query sql, [name, abstract, content, pid, isManager, timestamp]
        throw err if err

        aid = rows.insertId

        # 新增修訂記錄
        sql = 'INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);'

        (err, rows, fields) <- mariaPool.query sql, [aid, 'Create.', abstract, content, pid, isManager, timestamp]
        throw err if err

        if ctids.length
          # 新增分類標記 (需要檢查所以用 subquery)
          sql = '
          	INSERT INTO article_category (aid, ctid) 
            (SELECT ? AS aid, ctid FROM category WHERE ctid IN (?));
          '

          (err, rows, fields) <- mariaPool.query sql, [aid, ctids]
          throw err if err
          resp.success res, aid: aid
        else
          resp.success res, aid: aid
      else
        resp.fail res, {}
    else
      resp.fail res, {}

  app.delete \/api/article/item, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    aid = parseInt req.query.aid

    sql = 'DELETE FROM article WHERE aid=?;'
    
    if req.session.manager and aid
      (err, rows, fields) <- mariaPool.query sql, [aid]
      throw err if err

      sql = 'DELETE FROM article_modifying_record WHERE aid=?;'

      (err, rows, fields) <- mariaPool.query sql, [aid]
      throw err if err

      sql = 'DELETE FROM article_category WHERE aid=?;'

      (err, rows, fields) <- mariaPool.query sql, [aid]
      throw err if err

      sql = 'DELETE FROM article_discussion WHERE aid=?;'

      (err, rows, fields) <- mariaPool.query sql, [aid]
      throw err if err
      resp.success res, {}
    else
      resp.fail res, {}

  app.get \/api/article/modify, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    type = req.query.t

    switch type
    case \query_aid
      # 以 aid 查詢
      sql = '
      	SELECT mrid,abstract,comment,pid,is_manager,timestamp 
        FROM article_modifying_record WHERE aid=?;
      '

      aid = req.query.aid
      if parseInt aid
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    case \query_mrid
      # 以 mrid 查詢
      sql = 'SELECT * FROM article_modifying_record WHERE mrid=?;'

      mrid = req.query.mrid
      if parseInt mrid
        (err, rows, fields) <- mariaPool.query sql, [mrid]
        throw err if err

        result = {}
        # 查詢分類標記
        sql = '
          SELECT * FROM category WHERE ctid in 
          (SELECT ctid FROM article_category WHERE aid=?);
        '

        if rows.length
          result = rows[0]
          aid = rows[0].aid

          (err, rows, fields) <- mariaPool.query sql, [aid]
          throw err if err

          result.categorys = rows
          sql = 'SELECT name FROM article WHERE aid=?;'

          (err, rows, fields) <- mariaPool.query sql, [aid]
          throw err if err
          result.name = rows[0].name
          resp.success res, result

        else
          resp.fail res, {}
      else
        resp.fail res, {}

    default
      resp.fail res, {}

  app.post \/api/article/modify, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    type = req.body.t

    switch type
    case \modify
      content = html-encode req.body.content
      abstract = html-encode req.body.abstract
      comment = html-encode req.body.comment
      aid = req.body.aid
      pid = req.session.manager or req.session.guest
      isManager = if req.session.manager then 1 else 0
      timestamp = Date.now!

      sql = 'SELECT * FROM article WHERE aid=?;'

      if typeof aid and \number and content and abstract and comment
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err

        if rows.length
          sql = 'UPDATE article SET content=?,abstract=?,timestamp=? WHERE aid=?;'

          (err, rows, fields) <- mariaPool.query sql, [content, abstract, timestamp, aid]
          throw err if err

          sql = 'INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);'

          (err, rows, fields) <- mariaPool.query sql, [aid, comment, abstract, content, pid, isManager, timestamp]
          throw err if err
          resp.success res, mrid: rows.insertId
        else
          resp.fail res, {}
      else
        resp.fail res, {}

    case \back
      aid = req.body.aid
      mrid = req.body.mrid

      if typeof aid is \number and typeof mrid is \number

        sql = 'SELECT * FROM article_modifying_record WHERE mrid=?'

        (err, rows, fields) <- mariaPool.query sql, [mrid]
        throw err if err

        if rows.length
          content = rows[0].content
          abstract = rows[0].abstract
          comment = rows[0].comment + ' (back)'
          pid = rows[0].pid
          isManager = rows[0].is_manager
          timestamp = Date.now!

          sql = 'UPDATE article SET content=?,abstract=?,timestamp=? WHERE aid=?;';

          (err, rows, fields) <- mariaPool.query sql, [content, abstract, timestamp, aid]
          throw err if err
          sql = 'INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);'

          (err, rows, fields) <- mariaPool.query sql, [aid, comment, abstract, content, pid, isManager, timestamp]
          throw err if err
          resp.success res, mrid: rows.insertId
        else
          resp.fail res, {}
      else
        resp.fail res, {}
    default
      resp.fail res, {}

  app.get \/api/article/discuss, (req, res) ->
    #reqLoad(mariaPool, req, res, function() {
    type = req.query.t;

    switch type
    case \query_aid
      # 查詢討論
      sql = 'SELECT * FROM article_discussion WHERE aid=? ORDER BY timestamp DESC;'

      aid = req.query.aid

      if parseInt aid
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    case \query_mrid
      sql = '
        SELECT * FROM article_discussion WHERE aid in 
        (SELECT aid FROM article_modifying_record WHERE mrid=?)
      '

      mrid = req.query.mrid
      if parseInt mrid
        (err, rows, fields) <- mariaPool.query sql, [aid]
        throw err if err
        resp.success res, rows
      else
        resp.fail res, {}

    default
      resp.fail res, {}

  app.post \/api/article/discuss, (req, res) ->
    # reqLoad mariaPool, req, res, ->

    content = html-encode req.body.content
    aid = req.body.aid
    pid = req.session.manager or req.session.guest
    isManager = if req.session.manager then 1 else 0
    timestamp = Date.now!

    sql = 'SELECT * FROM article WHERE aid=?;'

    # 針對條目提出討論

    if typeof aid is 'number' and content
      (err, rows, fields) <- mariaPool.query sql, [aid]
      throw err if err

      if rows.length
        sql = '
          INSERT INTO article_discussion 
          VALUES(NULL, ?, ?, ?, ?, ?)
        '

        (err, rows, fields) <- mariaPool.query sql, [aid, content, pid, isManager, timestamp]
        throw err if err
        resp.success res, adid: rows.insertId
      else
        resp.fail res, {}
    else
      resp.fail res, {}

  app.delete \/api/article/discuss, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    adid = parseInt req.query.adid
    sql = 'DELETE FROM article_discussion WHERE adid=?;'

    if req.session.manager and adid
      (err, rows, fields) <- mariaPool.query sql, [adid]
      throw err if err
      resp.success res, {}
    else
      resp.fail res, {}