var apiModules = [
	'./user',
	'./article',
	'./category'
];

var modules = {
	reqLoad: './module/req_load',
	regexs: './module/regexs',
	res: './module/res'
};

module.exports = function(app, mariaPool) {

	// import modules to express app
	app.mods = {};
	for (var key in modules) {
		app.mods[key] = require(modules[key]);
	}

	apiModules.forEach(function(e) {
		require(e)(app, mariaPool);
	});

};
