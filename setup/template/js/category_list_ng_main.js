
var category_list = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
	$scope.managerSession = false;
	$scope.searchText = "";
	$scope.categorys = [];

	$scope.searchArticle = function() {
		if ($scope.searchText != "") {
			window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
		}
	}

	$scope.redirectToPage = function(url) {
		// 導向 article_list.html?ctid=x
		window.location.href = url;
	};

	$scope.itemClick = function(item) {
		if (item.num) {
			$scope.redirectToPage('item_list.html?ctid=' + item.ctid);
		}
	};

	// check manager session
	$http.get('/api/user/manager?t=check_session')
		.success(function(data) {
			var result = [];

			if (data instanceof Object && data.status == 100) {
				$scope.managerSession = true;
			} else {
				$scope.managerSession = false;
			}
		}
	);

	$scope.logout = function() {
		$http.post('/api/user/manager?t=logout')
			.success(function(data) {

				$scope.redirectToPage('index.html');
			}
		);
	}

	$http.get('/api/category/item?t=query')
		.success(function(data) {
			
			if (data instanceof Object && data.status == 100) {
				$scope.categorys = data.data;
			} else {
				
			}
		}
	);
}];

app.controller(category_list);