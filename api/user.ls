module.exports = (app, mariaPool) ->
  reqLoad = app.mods.reqLoad
  regexs = app.mods.regexs
  resp = app.mods.res

  app.get \/api/user/guest, (req, res) ->
    # reqLoad mariaPool, req, res, ->
    type = req.query.t

    switch type
    case \info
      # 訪客資訊
      sql = 'SELECT * FROM guest WHERE gid=?;'
      gid = req.query.gid

      if parseInt gid
        (err, rows, fields) <- mariaPool.query sql, [gid]
        throw err if err
        resp.success res, rows[0]
      else
        resp.fail res, {}

    case \session
      # 訪客修改名稱
      sql = 'UPDATE guest SET name=?,timestamp=? WHERE gid=?;'

      name = req.query.name;

      if name and name.match regexs.name
        (err, rows, fields) <- mariaPool.query sql, [name, Date.now!, req.session.guest]
        throw err if err
        resp.success res, {}
      else
        resp.fail res, {}

    default
      resp.fail res, {}

  app.get \/api/user/manager, (req, res) ->
    <- reqLoad mariaPool, req, res

    type = req.query.t

    switch type
    case \info
      # 管理者資訊
      sql = 'SELECT * FROM manager WHERE mid=?;'

      mid = req.query.mid
      if parseInt mid
        (err, rows, fields) <- mariaPool.query sql, [mid]
        throw err if err
        
        delete rows[0].passwd
        resp.success res, rows[0]
      else
        resp.fail res, {}

    case \check_session
      if req.session.manager
        resp.success res, {}
      else
        resp.fail res, {}

    default
      resp.fail res, {}

  app.post \/api/user/manager, (req, res) ->
    <- reqLoad mariaPool, req, res
    type = req.query.t

    switch type
    case \login
      # 管理者登入
      sql = 'SELECT * FROM manager WHERE username LIKE ? AND passwd LIKE ?;'

      username = req.body.username
      password = req.body.password
      if username and password and !req.session.manager
        (err, rows, fields) <- mariaPool.query sql, [escape(username), escape(password)]
        throw err if err
        
        if rows.length
          req.session.manager = rows[0].mid
          req.session.guest = 0
          delete rows[0].passwd
          resp.success res, rows[0]
        else
          resp.fail res, {}
      else
        resp.fail res, {}
    case \logout
      # 管理者登出
      if req.session.manager
        req.session.destroy!
        resp.success res, {}
      else
        resp.fail res, {}
    default
      resp.fail res, {}