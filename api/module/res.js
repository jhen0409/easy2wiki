var success = 100;
var fail = 200;

module.exports.success = function(res, data) {
	res.json({
		status: success,
		data: data
	});
};

module.exports.fail = function(res, data) {
	res.json({
		status: fail,
		data: data
	});
};