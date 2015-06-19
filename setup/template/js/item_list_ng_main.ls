item_list = ($scope, $http, $timeout) ->
  $scope.manager-session = false
  $scope.search-text = ''
  $scope.items = []
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  $scope.itemClick = (item) ->
    $scope.redirectToPage \item_view.html?aid= + item.aid

  function getArticleList data
    url = \/api/article/item
    q = {}
    if data.ctid
      q = t: \query_ctid, ctid: data.ctid
    else if data.keywd
      q = t: \query_kw, keywd: data.keywd
    else
      data.count = 10
      q = t: \query, count: data.count

    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.items = data.data

  getArticleList get-url-params!

  $scope.deleteArticle = (aid) ->
    $http.delete \/api/article/item?aid=' + aid
      .success (data) ->
        if data instanceof Object and data.status is 100
          getArticleList getUrlParams!

app.controller item_list