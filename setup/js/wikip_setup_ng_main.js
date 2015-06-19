// Generated by LiveScript 1.4.0
var init, e2w_setup;
init = function($){
  return $(function(){
    $('section [href^=#]').click(function(e){
      return e.preventDefault();
    });
    $(window).resize(function(){
      return $(window).scrollTop($(window).scrollTop() + 1);
    });
    setTimeout(function(){
      $('.bs-docs-sidenav').affix({
        offset: {
          top: function(){
            if ($(window).width() <= 980) {
              return 290;
            } else {
              return 210;
            }
          },
          bottom: 270
        }
      });
      $(window).scrollTop($(window).scrollTop() + 1);
      return $(window).scrollTop($(window).scrollTop() - 1);
    }, 100);
    $('#article_content table').attr('class', 'table table-bordered');
    return $('#article_content img').attr('class', 'img-polaroid');
  });
};
init(window.jQuery);
angular.module('easy2wiki', ['$strap.directives']).config(function($httpProvider){
  return $httpProvider.defaults.headers.post['Content-Type'] = 'application/json';
});
e2w_setup = function($scope, $http, $timeout){
  $scope.mysql_host = 'localhost';
  $scope.mysql_port = 3306;
  $scope.mysql_dbname = 'easy2wiki';
  $scope.mysql_username = '';
  $scope.mysql_password = '';
  $scope.redis_host = 'localhost';
  $scope.redis_port = 6379;
  $scope.wiki_name = '';
  $scope.license = 0;
  $scope.manager_username = '';
  $scope.manager_password = '';
  $scope.confirm_password = '';
  $scope.manager_name = '';
  $scope.redirectToPage = function(url){
    return window.location.href = url;
  };
  return $scope.installCheck = function(){
    var data, b;
    if ($scope.manager_password !== $scope.confirm_password) {
      alert('某些欄位沒有輸入或輸入有問題');
      return;
    }
    data = {
      mysql_host: $scope.mysql_host,
      mysql_port: $scope.mysql_port,
      mysql_dbname: $scope.mysql_dbname,
      mysql_username: $scope.mysql_username,
      mysql_password: $scope.mysql_password,
      redis_host: $scope.redis_host,
      redis_port: $scope.redis_port,
      wiki_name: $scope.wiki_name,
      license: $scope.license,
      manager_username: $scope.manager_username,
      manager_password: $scope.manager_password,
      manager_name: $scope.manager_name
    };
    b = 1;
    Object.keys(data).forEach(function(k){
      var b;
      if (!data[k] && data[k] !== Encoder.htmlDecode(data[k])) {
        return b = 0;
      }
    });
    if (!b) {
      reutrn(alert('某些欄位沒有輸入或輸入有問題'));
    }
    return $http.post('/install', data).success(function(data){
      if (data instanceof Object && data.status === 100) {
        return alert('Easy2Wiki 的安裝程序已完成，後端已建立 config.json 檔案，安裝頁面不能再次訪問，刪除 config.json 檔案可再從本頁重新開始設置。');
      } else {
        return alert('安裝失敗，請檢查欄位是否有輸入正確，並檢查是否安裝 MySQL, Redis 並能成功連線。');
      }
    });
  };
};