
var category_new = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.managerSession = false;
  $scope.searchText = "";
  $scope.messageErrorNameExist = 0;

  $scope.searchArticle = function() {
    if ($scope.searchText != "") {
      window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
    }
  }

  $scope.redirectToPage = function(url) {
    // 導向 article_list.html?ctid=x
    window.location.href = url;
  };

  $scope.newCategory = function() {
    if ($scope.name && $scope.abstract) {

      var data = { name: $scope.name, abstract: $scope.abstract };

      $http.post('/api/category/item', data)
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

  $scope.newCategoryChange = function() {
    $http.get('/api/category/item?t=exist&name=' + $scope.name)
      .success(function(data) {
        console.log(data);

        if (data instanceof Object && data.status == 100) {
          $scope.messageErrorNameExist = 1;
        } else {
          $scope.messageErrorNameExist = 0;
        }
      });
  }

  // check manager session
  $http.get('/api/user/manager?t=check_session')
    .success(function(data) {
      if (data instanceof Object && data.status == 100) {
        $scope.managerSession = true;
      } else {
        //沒有管理者權限 跳回首頁
        $scope.redirectToPage('index.html');
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

}];

app.controller(category_new);