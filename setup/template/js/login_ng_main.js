
var login = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.managerSession = false;
  $scope.searchText = "";

  $scope.searchArticle = function() {
    if ($scope.searchText != "") {
      window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
    }
  }

  $scope.redirectToPage = function(url) {
    // 導向 article_list.html?ctid=x
    window.location.href = url;
  };

  $scope.login = function() {
    if ($scope.username && $scope.password) {

      var data = { username: $scope.username, password: $scope.password };

      console.log(data);

      $http.post('/api/user/manager?t=login', data)
        .success(function(data) {

          console.log(data);

          if (data instanceof Object && data.status == 100) {
            $scope.redirectToPage('index.html');
          } else {
            alert('fail');
          }
        }
      );
    } else {
      alert('fail');
    }
  };

  // check manager session
  $http.get('/api/user/manager?t=check_session')
    .success(function(data) {
      var result = [];

      if (data instanceof Object && data.status == 100) {
        $scope.redirectToPage('index.html');
      } else {
        $scope.managerSession = false;
      }
    }
  );

}];

app.controller(login);