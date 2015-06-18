
var item_diff = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.managerSession = false;
  $scope.searchText = "";
  $scope.aid = null;
  $scope.mrid = null;
  $scope.articleName = "";
  $scope.articleData = "";
  $scope.marticleData = "";
  $scope.abstract = "";
  $scope.mabstract = "";

  $scope.searchArticle = function() {
    if ($scope.searchText != "") {
      window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
    }
  }

  $scope.loadArticle = function(data) {
    $http.get('/api/article/' + (data.aid ? 'item' : 'modify') +
        '?t=query_' +
        (data.aid ? 'aid&aid=' + data.aid : 'mrid&mrid=' + data.mrid))
    .success(function(data) {
      console.log(data);
      
      if (data instanceof Object && data.status == 100) {
        var result = data.data;

        if (result.mrid) {
          $scope.mrid = result.mrid;
          $scope.marticleData = result.content;
          $scope.mabstract = result.abstract;
        } else if (result.aid && !result.mrid) {
          $scope.aid = result.aid;
          $scope.articleData = result.content;
          $scope.abstract = result.abstract;
          $scope.articleName = result.name;
        } else {
          window.location.href = 'index.html';
        }
        if ($scope.articleData != "" && $scope.marticleData != "") {
          diffUsingJS(1, $scope.marticleData, $scope.articleData, 'article_diff');
          diffUsingJS(1, $scope.mabstract, $scope.abstract, 'abstract_diff');
        }
      } else {
        window.location.href = 'index.html';
      }
    });
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

  var hash = window.location.search.slice(1);
  var array = hash.split("&");
  var data = {};

  for (var i = 0; i < array.length; i++) {
    var values = array[i].split("=");
    data[values[0]] = values[1];
  }

  if (data.aid && data.mrid) {
    $scope.loadArticle({ aid: data.aid});
    $scope.loadArticle({ mrid: data.mrid});
  } else {
    window.location.href = 'index.html';
  }

  $scope.redirectToPage = function(url) {
    // 導向 article_list.html?ctid=x
    window.location.href = url;
  };

}];