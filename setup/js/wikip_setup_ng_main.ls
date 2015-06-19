init = ($) ->
  $ ->
    # Disable certain links in docs
    $ 'section [href^=#]' .click (e) ->
      e.prevent-default!

    # 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
    $ window .resize ->
      $ window .scrollTop ($ window .scrollTop! + 1)

    # side bar
    setTimeout do
      ->
        $ '.bs-docs-sidenav' .affix do
          offset:
            top: -> if $ window .width! <= 980 then 290 else 210
            bottom: 270
        $ window .scrollTop ($ window .scrollTop! + 1)
        $ window .scrollTop ($ window .scrollTop! - 1)
      100

    # Todo
    $ '#article_content table' .attr \class, 'table table-bordered'
    $ '#article_content img' .attr \class, \img-polaroid

init window.jQuery

angular.module \easy2wiki, [\$strap.directives] .config ($httpProvider) ->
  $httpProvider.defaults.headers.post[\Content-Type] = \application/json

e2w_setup = ($scope, $http, $timeout) ->
  $scope.mysql_host = 'localhost'
  $scope.mysql_port = 3306
  $scope.mysql_dbname = 'easy2wiki'
  # $scope.mysql_dbcommit = ''
  $scope.mysql_username = ''
  $scope.mysql_password = ''
  $scope.redis_host = 'localhost'
  $scope.redis_port = 6379
  # $scope.logo_file
  $scope.wiki_name = ''
  # $scope.edit_permissions
  $scope.license = 0
  $scope.manager_username = ''
  $scope.manager_password = ''
  $scope.confirm_password = ''
  $scope.manager_name = ''
  # $scope.manager_email

  $scope.redirect-to-page = (url) ->
    window.location.href = url

  $scope.install-check = ->
    if $scope.manager_password is not $scope.confirm_password
      alert \某些欄位沒有輸入或輸入有問題
      return

    data = 
      mysql_host: $scope.mysql_host
      mysql_port: $scope.mysql_port
      mysql_dbname: $scope.mysql_dbname
      # mysql_dbcommit: $scope.mysql_dbcommit
      mysql_username: $scope.mysql_username
      mysql_password: $scope.mysql_password
      redis_host: $scope.redis_host
      redis_port: $scope.redis_port
      # logo_file: $scope.logo_file
      wiki_name: $scope.wiki_name
      # edit_permissions: $scope.edit_permissions
      license: $scope.license
      manager_username: $scope.manager_username
      manager_password: $scope.manager_password
      manager_name: $scope.manager_name
      # manager_email: $scope.manager_email

    b = 1
    Object.keys data .forEach (k) ->
      b = 0 if !data[k] and data[k] is not Encoder.html-decode data[k]
        
    reutrn alert \某些欄位沒有輸入或輸入有問題 if !b
    $http.post \/install, data
      .success (data) ->
        if data instanceof Object and data.status is 100
          alert 'Easy2Wiki 的安裝程序已完成，後端已建立 config.json 檔案，安裝頁面不能再次訪問，刪除 config.json 檔案可再從本頁重新開始設置。'
        else
          alert '安裝失敗，請檢查欄位是否有輸入正確，並檢查是否安裝 MySQL, Redis 並能成功連線。'