var app = angular.module('wikiproject', ['$strap.directives']).config(function($httpProvider) {
	$httpProvider.defaults.headers.post['Content-Type'] =
		'application/json';
});

app.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});