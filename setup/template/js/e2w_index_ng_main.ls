e2w_index = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ''
  $scope.items = []
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  function getArticleList data
    url = \/api/article/item
    q = {}
    if data.ctid
      q = t: \query_ctid, ctid: data.ctid
    else if data.keywd
      q = t: \query_kw, keywd: data.keywd
    else
      data.count = 5
      q = t: \query, count: data.count
    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.items = data.data

  getArticleList get-url-params!

  $scope.itemClick = (item) ->
    $scope.redirect-to-page get-url \item_view.html, aid: item.aid

app.controller e2w_index