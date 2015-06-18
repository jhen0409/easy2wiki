
var wikip_index = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
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
    $scope.redirectToPage('item_view.html?aid=' + item.aid);
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

  function getArticleList(data) {
    var url = '/api/article/item';
    var q = '?t=query';
    if (data.ctid) {
      q += '_ctid&ctid=' + data.ctid;
    } else if (data.keywd) {
      q += '_kw&keywd=' + data.keywd;
    } else {
      data.count = 5;
      q += '&count=' + data.count;
    }
    $http.get(url + q)
      .success(function(data) {
        if (data instanceof Object && data.status == 100) {
          $scope.items = data.data;
        } else {
          
        }
      });
  }

  var hash = window.location.search.slice(1);
  var array = hash.split("&");
  var data = {};

  for (var i = 0; i < array.length; i++) {
    var values = array[i].split("=");
    data[values[0]] = values[1];
  }

  getArticleList(data);

}];

app.controller(wikip_index);