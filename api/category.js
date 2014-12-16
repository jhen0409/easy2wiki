var htmlEncode = require("html-escape");

module.exports = function(app, mariaPool) {
	var reqLoad = app.mods.reqLoad;
	var regexs = app.mods.regexs;
	var resp = app.mods.res;

	app.get('/api/category/item', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var type = req.query.t;

			// 查詢分類(判斷重複或是以 keyword 查詢或是 ctid 或是 aid)

			switch (type) {
				case 'exist':
					// 分類是否已存在
					var sql = "SELECT * FROM category WHERE name LIKE ?;";

					var name = req.query.name;
					if (name && name.match(regexs.name)) {
						mariaPool.query(sql, [name], function(err, rows, fields) {
							if (err) throw err;
							
							if (rows.length) {
								resp.success(res, rows[0]);
							} else {
								resp.fail(res, {});
							}
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'query':
					var sql = "SELECT c.ctid, c.name, c.abstract, COUNT(ac.aid) AS num " +
						"FROM category c " +
						"LEFT JOIN article_category ac ON(c.ctid=ac.ctid) " +
						"GROUP BY ctid " +
						"ORDER BY ctid DESC;";

					mariaPool.query(sql, function(err, rows, fields) {
						if (err) throw err;

						resp.success(res, rows);
					});
					break;
				case 'query_kw':
					// 以 keyword 查詢
					var sql = "SELECT * FROM category WHERE name LIKE ? OR abstract LIKE ?;";

					var kw = '%' + req.query.keywd + '%';

					if (kw) {
						mariaPool.query(sql, [kw, kw], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, rows);

							console.log(rows);
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'query_ctid':
					// 以 ctid 查詢
					var sql = "SELECT * FROM category WHERE ctid=?;";

					var ctid = req.query.ctid;
					if (parseInt(ctid)) {
						mariaPool.query(sql, [ctid], function(err, rows, fields) {
							if (err) throw err;

							if (rows.length) {
								resp.success(res, rows[0]);
							} else {
								resp.fail(res, {});
							}
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'query_aid':
					// 以 aid 查詢
					var sql = "SELECT * FROM category WHERE ctid=(SELECT ctid FROM article_category WHERE aid=?);";

					var aid = req.query.aid;
					if (parseInt(aid)) {
						mariaPool.query(sql, [aid], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, rows);
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

	app.post('/api/category/item', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var name = req.body.name;
			var abstract = htmlEncode(req.body.abstract);

			var sql = "SELECT * FROM category WHERE name LIKE ?;";

			if (name && abstract && req.session.manager) {
				mariaPool.query(sql, [name], function(err, rows, fields) {
					if (err) throw err;

					if (!rows.length) {
						var sql = "INSERT INTO category VALUES(NULL, ?, ?);";

						mariaPool.query(sql, [name, abstract], function(err, rows, fields) {
							if (err) throw err;
							
							resp.success(res, { ctid: rows.insertId });
						});

					} else {
						resp.fail(res, {});
					}
				});
			} else {
				resp.fail(res, {});
			}
		//});
	});
}