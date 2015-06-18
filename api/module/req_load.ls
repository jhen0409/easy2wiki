module.exports = (pool, req, res, callback) ->
  sess = req.session

  if sess.manager
    callback!
  else if !sess.guest
    uip = req.connection.remoteAddress
    sql = 'SELECT * FROM guest WHERE source_ip LIKE ?;'

    pool.query sql, [uip], (err, rows, fields) ->
      throw err if err

      if !rows.length
        sql = 'INSERT INTO guest VALUES(NULL, ?, ?, ?);'
        pool.query sql, [uip, \guest, Date.now!], (err, rows, fields) ->
          throw err if err

          sess.guest = rows.insertId
          callback!
      else
        sess.guest = rows[0].gid
        callback!
  else
    callback!