!function($) {

  $(function() {

    // Disable certain links in docs
    $('section [href^=#]').click(function(e) {
      e.preventDefault()
    });

    // 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
    $(window).resize(function() {
      $(window).scrollTop($(window).scrollTop() + 1);
    });

    // side bar
    setTimeout(function () {
      $('.bs-docs-sidenav').affix({
        offset: {
          top: function () { return $(window).width() <= 980 ? 290 : 210 }, 
          bottom: 270
        }
      })
      $(window).scrollTop($(window).scrollTop() + 1);
      $(window).scrollTop($(window).scrollTop() - 1);
    }, 100);

    // Todo
    $('#article_content table').attr('class', 'table table-bordered');
    $('#article_content img').attr('class', 'img-polaroid');
  });

}(window.jQuery)

var app = angular.module('wikiproject', ['$strap.directives']).config(function($httpProvider) {
  $httpProvider.defaults.headers.post['Content-Type'] =
    'application/json';
});

var wikip_setup = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.mysql_host = 'localhost';
  $scope.mysql_port = 3306;
  $scope.mysql_dbname = 'easy2wiki';
  // $scope.mysql_dbcommit = '';
  $scope.mysql_username = '';
  $scope.mysql_password = '';
  $scope.redis_host = 'localhost';
  $scope.redis_port = 6379;
  // $scope.logo_file, 
  $scope.wiki_name = '';
  // $scope.edit_permissions, 
  $scope.license = 0;
  $scope.manager_username = '';
  $scope.manager_password = '';
  $scope.confirm_password = '';
  $scope.manager_name = '';
  // $scope.manager_email

  $scope.redirectToPage = function(url) {
    window.location.href = url;
  };

  $scope.installCheck = function() {
    if ($scope.manager_password != $scope.confirm_password) {
      alert('某些欄位沒有輸入或輸入有問題');
      return;
    }

    var data = {
      mysql_host: $scope.mysql_host, 
      mysql_port: $scope.mysql_port, 
      mysql_dbname: $scope.mysql_dbname, 
      // mysql_dbcommit: $scope.mysql_dbcommit, 
      mysql_username: $scope.mysql_username,
      mysql_password: $scope.mysql_password,
      redis_host: $scope.redis_host, 
      redis_port: $scope.redis_port, 
      // logo_file: $scope.logo_file, 
      wiki_name: $scope.wiki_name, 
      // edit_permissions: $scope.edit_permissions, 
      license: $scope.license, 
      manager_username: $scope.manager_username, 
      manager_password: $scope.manager_password, 
      manager_name: $scope.manager_name
      // manager_email: $scope.manager_email
    };

    console.log(data);

    var b = 1;
    for (var k in data) {
      if (!data[k] && data[k] != Encoder.htmlDecode(data[k])) {
        b = 0;
      }
    }

    if (b) {
      $http.post('/install', data)
        .success(function(data) {

          console.log(data);

          if (data instanceof Object && data.status == 100) {
            alert('Easy2Wiki 的安裝程序已完成，後端已建立 config.json 檔案，安裝頁面不能再次訪問，刪除 config.json 檔案可再從本頁重新開始設置。')
            
          } else {
            alert('安裝失敗，請檢查欄位是否有輸入正確，並檢查是否安裝 MySQL, Redis 並能成功連線。')
          }
        }
      );
    } else {
      alert('某些欄位沒有輸入或輸入有問題');
    }
  }

}];

app.controller(wikip_setup);

