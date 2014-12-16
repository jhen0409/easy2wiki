
var item_modify_record = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
	$scope.managerSession = false;
	$scope.searchText = "";
	$scope.items = [];

	$scope.searchArticle = function() {
		if ($scope.searchText != "") {
			window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
		}
	}

	$scope.redirectToPage = function(url) {
		window.location.href = url;
	};

	$scope.itemClick = function(item) {
		$scope.redirectToPage('item_view.html?mrid=' + item.mrid);
	};

	$scope.getTime = function(timestamp) {
		return moment(new Date(timestamp)).format("YYYY/MM/DD HH:mm:ss");
	};

	function getPidInfo(obj, callback) {
		$http.get('/api/user/' + (obj.is_manager ? 'manager' : 'guest')
		 		+ '?t=info&' + (obj.is_manager ? 'mid' : 'gid') + '=' + obj.pid)
			.success(function(data) {
				console.log(data);
				if (data instanceof Object && data.status == 100) {
					var r = data.data;
					callback(obj, r);
				} else {
					callback(obj, null);
				}
			});
	};

	function getModifyRecord(data) {
		$http.get('/api/article/modify?t=query_aid&aid=' + data.aid)
			.success(function(data) {
				console.log(data);
				if (data instanceof Object && data.status == 100) {
					$scope.items = data.data;

					for (var i = 0; i < $scope.items.length; i++) {
						getPidInfo({ ind: i, pid: $scope.items[i].pid, is_manager: $scope.items[i].is_manager }, function(obj, data) {
							console.log($scope.items[obj.ind])
							$scope.items[obj.ind].name = data.name;

							if (!$scope.items[obj.ind].is_manager) {
								$scope.items[obj.ind].source_ip = data.source_ip;
								$scope.items[obj.ind].modifier = data.name + ' (Source IP: ' + data.source_ip + ')';
							} else {
								$scope.items[obj.ind].modifier = data.name + ' (管理者)';
							}
						});
					}
				} else {
					
				}
			});
	}

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

	var hash = window.location.search.slice(1);
	var array = hash.split("&");
	var data = {};

	for (var i = 0; i < array.length; i++) {
		var values = array[i].split("=");
		data[values[0]] = values[1];
	}

	if (data.aid) {
		getModifyRecord(data);
	} else {

	}

}];

app.controller(item_modify_record);