login = ($scope, $http, $timeout) ->
  $scope.manager-session = false
  $scope.search-rext = ''
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!

  $scope.login = ->
    if $scope.username and $scope.password
      data = username: $scope.username, password: $scope.password

      $http.post \/api/user/manager?t=login, data
        .success (data) ->
          if data instanceof Object and data.status is 100
            $scope.redirectToPage \index.html
          else
            alert \fail
    else
      alert \fail

  # check manager session
  check-session $scope, $http, true

app.controller login