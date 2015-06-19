category_list = ($scope, $http, $timeout) ->
  $scope.manager-session = false
  $scope.search-text = ''
  $scope.categorys = []
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  $scope.itemClick = (item) ->
    if item.num
      $scope.redirectToPage get-url \item_list.html, ctid: item.ctid

  $http.get \/api/category/item?t=query
    .success (data) ->
      if data instanceof Object and data.status is 100
        $scope.categorys = data.data

app.controller category_list