item_diff = ($scope, $http, $timeout) ->
  $scope.manager-session = false
  $scope.search-text = ''
  $scope.aid = null
  $scope.mrid = null
  $scope.article-name = ''
  $scope.article-data = ''
  $scope.marticle-data = ''
  $scope.abstract = ''
  $scope.mabstract = ''
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http
  
  # check manager session
  check-session $scope, $http

  data = get-url-params!

  if data.aid and data.mrid
    $scope.loadArticle aid: data.aid
    $scope.loadArticle mrid: data.mrid
  else
    window.location.href = \index.html

  $scope.loadArticle = (data) ->
    url = \/api/article/ + (if data.aid then \item else \modify)
    q = {}
    if data.aid
      q = t: \query_aid, aid: data.aid
    else
      q = t: \query_mrid, mrid: data.mrid

    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          result = data.data

          if result.mrid
            $scope.mrid = result.mrid
            $scope.marticleData = result.content
            $scope.mabstract = result.abstract
          else if result.aid and !result.mrid
            $scope.aid = result.aid
            $scope.articleData = result.content
            $scope.abstract = result.abstract
            $scope.articleName = result.name
          else
            window.location.href = \index.html

          if $scope.articleData is not '' and $scope.marticleData is not ''
            diffUsingJS 1, $scope.marticleData, $scope.articleData, \article_diff
            diffUsingJS 1, $scope.mabstract, $scope.abstract, \abstract_diff
        else
          window.location.href = \index.html

app.controller item_diff