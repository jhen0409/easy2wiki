var async = require('async');
var htmlEncode = require("html-escape");

module.exports = function(app, mariaPool) {
	var reqLoad = app.mods.reqLoad;
	var regexs = app.mods.regexs;
	var resp = app.mods.res;

	app.get('/api/article/item', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {

			var type = req.query.t;

			switch (type) {
				case 'exist':
					// 條目是否已存在(新增條目時要比對)
					var sql = "SELECT * FROM article WHERE name like ?;";

					var name = req.query.name;
					if (name && name.match(regexs.name)) {
						mariaPool.query(sql, [name], function(err, rows, fields) {
							if (err) throw err;
							
							if (!rows.length) {
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
					// 查詢前 n 筆資料
					var sql = "SELECT aid,name,abstract,pid,is_manager,timestamp " + 
							"FROM article ORDER BY timestamp DESC LIMIT ?,?;";

					var ind = parseInt(req.query.ind);
					var count = parseInt(req.query.count);

					if (!ind) {
						ind = 0;
					}
					if (!count) {
						count = 10;
					}

					mariaPool.query(sql, [ind, count], function(err, rows, fields) {
						if (err) throw err;
						
						resp.success(res, rows);
					});
					break;
				case 'query_kw':
					// 以 keyword 查詢
					var sql = "SELECT aid,name,abstract,pid,is_manager,timestamp " + 
							"FROM article WHERE name LIKE ? OR content LIKE ? OR abstract LIKE ?;";

					var kw = '%' + req.query.keywd + '%';

					if (kw) {
						mariaPool.query(sql, [kw, kw, kw], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, rows);
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'query_aid':
					// 以 aid 查詢
					var sql = "SELECT * FROM article WHERE aid=?;";

					var aid = req.query.aid;

					if (parseInt(aid)) {
						mariaPool.query(sql, [aid], function(err, rows, fields) {
							if (err) throw err;

							if (rows.length) {
								var result = rows[0];

								//查詢分類標記
								var sql = "SELECT * FROM category WHERE ctid in " + 
									"(SELECT ctid FROM article_category WHERE aid=?);";

								mariaPool.query(sql, [aid], function(err, rows, fields) {
									if (err) throw err;

									result.categorys = rows;

									resp.success(res, result);
								});
							} else {
								resp.fail(res, {});
							}
						});
					} else {
						resp.fail(res, {});
					}
					break;
				case 'query_ctid':
					// 以 ctid 查詢
					var sql = "SELECT aid,name,abstract,pid,is_manager,timestamp FROM article " + 
							"WHERE aid in (SELECT aid FROM article_category WHERE ctid=?);";

					var ctid = req.query.ctid;

					if (parseInt(ctid)) {
						mariaPool.query(sql, [ctid], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, rows);
						});
					} else {
						resp.fail(res, {});
					}
					break;
				default:

			}
		//});
	});

	app.post('/api/article/item', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var name = req.body.name;
			var abstract = htmlEncode(req.body.abstract);
			var content = htmlEncode(req.body.content);
			var ctids = req.body.ctids;

			console.log(content);

			var b = 1;
			if (Object.prototype.toString.call(ctids) == '[object Array]') {
				ctids.forEach(function(e) {
					if (typeof(e) != 'number') b = 0;
				});
			}

			if (b && name && name.match(regexs.name) && abstract && content) {

				// 判斷名稱重複
				var sql = "SELECT * FROM article WHERE name like ?;";

				mariaPool.query(sql, [name], function(err, rows, fields) {
					if (err) throw err;

					if (!rows.length) {
						// 新增
						var sql = "INSERT INTO article VALUES(NULL, ?, ?, ?, ?, ?, ?);";

						var pid = req.session.manager || req.session.guest;
						var isManager = req.session.manager ? 1 : 0;
						var timestamp = Date.now();

						mariaPool.query(sql, [name, abstract, content, pid, isManager, timestamp], function(err, rows, fields) {
							if (err) throw err;

							var aid = rows.insertId;

							// 新增修訂記錄
							var sql = "INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);";

							mariaPool.query(sql, [aid, 'Create.', abstract, content, pid, isManager, timestamp], function(err, rows, fields) {
								if (err) throw err;

								if (ctids.length) {
									// 新增分類標記 (需要檢查所以用 subquery)
									var sql = "INSERT INTO article_category (aid, ctid) " + 
										"(SELECT ? AS aid, ctid FROM category WHERE ctid IN (?));";

									mariaPool.query(sql, [aid, ctids], function(err, rows, fields) {
										if (err) throw err;
										resp.success(res, { aid: aid });
									});
								} else {
									resp.success(res, { aid: aid });
								}
							});
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

	app.delete('/api/article/item', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var aid = parseInt(req.query.aid);

			var sql = 'DELETE FROM article WHERE aid=?;';
			
			if (req.session.manager && aid) {

				mariaPool.query(sql, [aid], function(err, rows, fields) {
					if (err) throw err;

					var sql = 'DELETE FROM article_modifying_record WHERE aid=?;';

					mariaPool.query(sql, [aid], function(err, rows, fields) {
						if (err) throw err;

						var sql = 'DELETE FROM article_category WHERE aid=?;';

						mariaPool.query(sql, [aid], function(err, rows, fields) {
							if (err) throw err;

							var sql = 'DELETE FROM article_discussion WHERE aid=?;';

							mariaPool.query(sql, [aid], function(err, rows, fields) {
								if (err) throw err;

								resp.success(res, {});

							});
						});
					});
				});
			} else {
				resp.fail(res, {});
			}
		//});
	});

	app.get('/api/article/modify', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var type = req.query.t;

			switch (type) {
				case 'query_aid':
					// 以 aid 查詢
					var sql = 'SELECT mrid,abstract,comment,pid,is_manager,timestamp ' +
						'FROM article_modifying_record WHERE aid=?;';

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
				case 'query_mrid':
					// 以 mrid 查詢
					var sql = 'SELECT * FROM article_modifying_record WHERE mrid=?;';

					var mrid = req.query.mrid;
					if (parseInt(mrid)) {

						mariaPool.query(sql, [mrid], function(err, rows, fields) {
							if (err) throw err;

							var result = {};

							// 查詢分類標記
							var sql = 'SELECT * FROM category WHERE ctid in ' +
								'(SELECT ctid FROM article_category WHERE aid=?);';

							if (rows.length) {
								result = rows[0];
								var aid = rows[0].aid;

								mariaPool.query(sql, [aid], function(err, rows, fields) {
									if (err) throw err;

									result.categorys = rows;

									var sql = 'SELECT name FROM article WHERE aid=?;';

									mariaPool.query(sql, [aid], function(err, rows, fields) {
									 	if (err) throw err;

									 	result.name = rows[0].name;
									 	resp.success(res, result);
									});
								});
							} else {
								resp.fail(res, {});
							}
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

	app.post('/api/article/modify', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var type = req.body.t;

			switch (type) {
				case 'modify':
					var content = htmlEncode(req.body.content);
					var abstract = htmlEncode(req.body.abstract);
					var comment = htmlEncode(req.body.comment);
					var aid = req.body.aid;
					var pid = req.session.manager || req.session.guest;
					var isManager = req.session.manager ? 1 : 0;
					var timestamp = Date.now();

					var sql = 'SELECT * FROM article WHERE aid=?;';

					if (typeof(aid) == 'number' && content && abstract && comment) {
						mariaPool.query(sql, [aid], function(err, rows, fields) {
							if (err) throw err;

							if (rows.length) {
								var sql = "UPDATE article SET content=?,abstract=?,timestamp=? WHERE aid=?;";

								mariaPool.query(sql, [content, abstract, timestamp, aid], function(err, rows, fields) {
									if (err) throw err;

									var sql = "INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);";

									mariaPool.query(sql, [aid, comment, abstract, content, pid, isManager, timestamp], function(err, rows, fields) {
										if (err) throw err;

										resp.success(res, { mrid: rows.insertId });
									});
								});
							} else {
								resp.fail(res, {});
							}
						});
					} else {
						resp.fail(res, {});
					}

					break;
				case 'back':

					var aid = req.body.aid;
					var mrid = req.body.mrid;

					if (typeof(aid) == 'number' && typeof(mrid) == 'number') {

						var sql = 'SELECT * FROM article_modifying_record WHERE mrid=?';

						mariaPool.query(sql, [mrid], function(err, rows, fields) {
							if (err) throw err;

							if (rows.length) {
								var content = rows[0].content;
								var abstract = rows[0].abstract;
								var comment = rows[0].comment + ' (back)';
								var pid = rows[0].pid;
								var isManager = rows[0].is_manager;
								var timestamp = Date.now();

								var sql = 'UPDATE article SET content=?,abstract=?,timestamp=? WHERE aid=?;';

								mariaPool.query(sql, [content, abstract, timestamp, aid], function(err, rows, fields) {
									if (err) throw err;

									var sql = 'INSERT INTO article_modifying_record VALUES(NULL, ?, ?, ?, ?, ?, ?, ?);';

									mariaPool.query(sql, [aid, comment, abstract, content, pid, isManager, timestamp], function(err, rows, fields) {
										if (err) throw err;

										resp.success(res, { mrid: rows.insertId });
									});
								});
							} else {
								resp.fail(res, {});
							}
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

	app.get('/api/article/discuss', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var type = req.query.t;

			switch (type) {
				case 'query_aid':
					// 查詢討論
					var sql = 'SELECT * FROM article_discussion WHERE aid=? ORDER BY timestamp DESC;';

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
				case 'query_mrid':
					var sql = 'SELECT * FROM article_discussion WHERE aid in ' +
						'(SELECT aid FROM article_modifying_record WHERE mrid=?)';

					var mrid = req.query.mrid;
					if (parseInt(mrid)) {
						
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

	app.post('/api/article/discuss', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {

			var content = htmlEncode(req.body.content);
			var aid = req.body.aid;
			var pid = req.session.manager || req.session.guest;
			var isManager = req.session.manager ? 1 : 0;
			var timestamp = Date.now();

			var sql = 'SELECT * FROM article WHERE aid=?;';

			// 針對條目提出討論

			if (typeof(aid) == 'number' && content) {
				mariaPool.query(sql, [aid], function(err, rows, fields) {
					if (err) throw err;

					if (rows.length) {
						var sql = "INSERT INTO article_discussion " +
							"VALUES(NULL, ?, ?, ?, ?, ?);";

						mariaPool.query(sql, [aid, content, pid, isManager, timestamp], function(err, rows, fields) {
							if (err) throw err;

							resp.success(res, { adid: rows.insertId });
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

	app.delete('/api/article/discuss', function(req, res) {
		//reqLoad(mariaPool, req, res, function() {
			var adid = parseInt(req.query.adid);

			var sql = 'DELETE FROM article_discussion WHERE adid=?;';

			if (req.session.manager && adid) {
				mariaPool.query(sql, [adid], function(err, rows, fields) {
					if (err) throw err;

					resp.success(res, {});
				});
			} else {
				resp.fail(res, {});
			}
		//});
	});

}