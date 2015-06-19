category_new = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ''
  $scope.messageErrorNameExist = 0
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  $scope.newCategory = ->
    alert \fail if !$scope.name or !$scope.abstract

    data = name: $scope.name, abstract: $scope.abstract

    $http.post \/api/category/item, data
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.redirectToPage \index.html
        else
          alert \fail
      
  $scope.newCategoryChange = ->
    $http.get get-url \/api/category/item, t: exist, name: $scope.name
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.messageErrorNameExist = 1
        else
          $scope.messageErrorNameExist = 0

  # check manager session
  check-session $scope, $http, false, true

app.controller category_new