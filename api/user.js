module.exports = function(app, mariaPool) {
	var reqLoad = app.mods.reqLoad;
	var regexs = app.mods.regexs;
	var resp = app.mods.res;

	app.get('/api/user/guest', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var type = req.query.t;

			switch (type) {
				case 'info':
					// 訪客資訊
					var sql = "SELECT * FROM guest WHERE gid=?;";

					var gid = req.query.gid;

					if (parseInt(gid)) {
						mariaPool.query(sql, [gid], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, rows[0]);
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'session':
					// 訪客修改名稱
					var sql = "UPDATE guest SET name=?,timestamp=? WHERE gid=?;";

					var name = req.query.name;

					if (name && name.match(regexs.name)) {
						mariaPool.query(sql, [name, Date.now(), req.session.guest], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, {});
						});
					} else {
						resp.fail(res, {});
					}

					break;
				default:
					resp.fail(res, {});
			}
		//});
	});

	app.get('/api/user/manager', function(req, res) {
		reqLoad(mariaPool, req, res, function() {

			var type = req.query.t;

			switch (type) {
				case 'info':
					// 管理者資訊
					var sql = "SELECT * FROM manager WHERE mid=?;";

					var mid = req.query.mid;
					if (parseInt(mid)) {
						mariaPool.query(sql, [mid], function(err, rows, fields) {
							if (err) throw err;
							
							delete rows[0].passwd;
							resp.success(res, rows[0]);
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'check_session':
					if (req.session.manager) {
						resp.success(res, {});
					} else {
						resp.fail(res, {});
					}
					break;
				default:
					resp.fail(res, {});
			}
		});
	});

	app.post('/api/user/manager', function(req, res) {
		reqLoad(mariaPool, req, res, function() {
			var type = req.query.t;

			console.log(req.body);

			switch (type) {
				case 'login':
					// 管理者登入
					var sql = "SELECT * FROM manager WHERE username LIKE ? AND passwd LIKE ?;";

					var username = req.body.username;
					var password = req.body.password;
					if (username && password && !req.session.manager) {
						mariaPool.query(sql, [escape(username), escape(password)], function(err, rows, fields) {
							if (err) throw err;
							
							if (rows.length) {
								req.session.manager = rows[0].mid;
								req.session.guest = 0;

								delete rows[0].passwd;
								resp.success(res, rows[0]);
							} else {
								resp.fail(res, {});
							}
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'logout':
					// 管理者登出
					if (req.session.manager) {
						req.session.destroy();
						resp.success(res, {});
					} else {
						resp.fail(res, {});
					}
					break;
				default:
					resp.fail(res, {});
			}
		});
	});
}