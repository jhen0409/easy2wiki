item_modify_record = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ''
  $scope.items = []
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout

  # check manager session
  check-session $scope, $http

  function get-pid-info obj, callback
    url = \/api/user/ + (if obj.is_manager then \manager else \guest)
    q = t: \info
    if obj.is_manager
      q.mid = obj.pid
    else
      q.gid = obj.pid
    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          callback obj, data.data
        else
          callback obj, null

  function get-modify-record data
    $http.get get-url \/api/article/modify, t: \query_aid, aid: data.aid
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.items = data.data
          $scope.items.for-each (item, i) ->
            (obj, data) <- get-pid-info ind: i, pid: item.pid, is_manager: item.is_manager
            $scope.items[obj.ind].name = data.name
            if !$scope.items[obj.ind].is_manager
              $scope.items[obj.ind].source_ip = data.source_ip
              $scope.items[obj.ind].modifier = data.name + ' (Source IP: ' + data.source_ip + ')'
            else
              $scope.items[obj.ind].modifier = data.name + ' (管理者)'

  data = get-url-params!

  get-modify-record data if data.aid

  $scope.item-click = (item) ->
    $scope.redirect-to-page \item_view.html?mrid= + item.mrid

  $scope.get-time = (timestamp) ->
    moment(new Date timestamp).format 'YYYY/MM/DD HH:mm:ss'

app.controller item_modify_record