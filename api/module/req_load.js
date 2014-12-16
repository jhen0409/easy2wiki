


module.exports = function(pool, req, res, cb) {
	var sess = req.session;

	console.log(sess);

	if (sess.manager) {
		cb();
	} else if (!sess.guest) {

		var uip = req.connection.remoteAddress;
		var sql = "SELECT * FROM guest WHERE source_ip LIKE ?;";

		pool.query(sql, [uip], function(err, rows, fields) {
			if (err) throw err;

			if (!rows.length) {
				var sql = "INSERT INTO guest VALUES(NULL, ?, ?, ?);";
				pool.query(sql, [uip, 'guest', Date.now()], function(err, rows, fields) {
					if (err) throw err;

					sess.guest = rows.insertId;

					cb();
				});
			} else {
				sess.guest = rows[0].gid;
				cb();
			}
		});
	} else {
		cb();
	}

}