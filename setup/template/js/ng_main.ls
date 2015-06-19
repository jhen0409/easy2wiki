app = angular.module \easy2wiki, [\$strap.directives] .config ($httpProvider) ->
  $httpProvider.defaults.headers.post[\Content-Type] = \application/json

app.directive \ngEnter, ->
  (scope, element, attrs) ->
    (event) <- element.bind 'keydown keypress'
    if event.which is 13
      event.preventDefault!
      <- scope.$apply
      scope.$eval attrs.ngEnter

get-url-params = ->
  hash = window.location.search.slice 1
  array = hash.split \&
  data = {}

  array.forEach (item) ->
    values = item.split \=
    data[values[0]] = values[1]

  data

get-url = (url, q) ->
  qs = []
  Object.keys q .forEach (key) ->
    qs.push key + '=' + q[key]
  result = ''
  if qs.length
    result = '?' + qs.join \&
  url + result

check-session = ($scope, $http, isInLoginPage, isManagerOnly) ->
  $http.get \/api/user/manager?t=check_session
    .success (data) ->
      if data instanceof Object and data.status is 100
        $scope.managerSession = true
        # 如果在 login 頁面的話, 就直接跳回
        $scope.redirect-to-page \index.html if isInLoginPage
      else
        $scope.managerSession = false
        # 如果這個頁面是管理者才可以使用, 就直接跳回
        $scope.redirect-to-page \index.html if isManagerOnly

get-search-text = ($scope) ->
  ->
    if $scope.searchText is not ''
      window.location.href = get-url \item_list.html, t: \query_kw, keywd: $scope.search-text

get-redirect-to-page = ->
  (url) ->
    window.location.href = url

get-logout = ($scope, $http) ->
  ->
    $http.post \/api/user/manager?t=logout
      .success (data) ->
        $scope.redirect-to-page \index.html