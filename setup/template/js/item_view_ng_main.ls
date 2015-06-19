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

item_view = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ''
  $scope.aid = null
  $scope.mrid = null
  $scope.items = []
  $scope.abstract = ''
  $scope.articleName = ''
  $scope.articleContent = ''
  $scope.viewHtml = ''
  $scope.timestamp = 0
  $scope.categorys = []
  $scope.guestName = ''
  $scope.disscussContent = ''
  $scope.disscussions = []
  $scope.modifier = ''
  $scope.modifierName = ''
  $scope.personName = ''
  $scope.pid = 0
  $scope.is_manager = false
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  $scope.itemInit = ->
    # items number
    ind = 0
    temp = 0
    $scope.items.forEach (item) ->
      switch item.type
      case 0
        item.ind = ++ind
        temp = 0
      case 1
        item.ind = ind
        item.subInd = ++temp

  $scope.updateItems = ->
    content = $scope.articleContent

    dirs = /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g  # title(sub) Regex.
    dirTitle = /{{{ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *}}}/g  # title Regex.
    dirTitleRp = /{{{|}}}| +/g;  # replace
    dirSubTitle = /{\[\[ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *\]\]}/g  # sub title Regex.
    dirSubTitleRp = /{\[\[|\]\]}| +/g;  # replace

    results = content.match dirs 
    items = []

    if results is not null
      temp = ''
      dIndex = 0
      results.for-each (result) ->
        dIndex := dirs.exec content .index
        if result.match dirTitle
          temp := result.replace dirTitleRp, ''
          items.push type: 0, val: temp, dIndex: dIndex, proto: result
        else if result.match dirSubTitle
          temp := result.replace dirSubTitleRp, ''
          items.push type: 1, val: temp, dIndex: dIndex, proto: result
        else
          console.log \WTF?

    delete $scope.items
    $scope.items = items
    $scope.itemInit!

  function getPidInfo obj, callback
    url = \/api/user/ + (if obj.is_manager then \manager else \guest)
    q = t: \info
    if obj.is_manager
      q.mid = obj.pid
    else
      q.gid = obj.pid
    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          r = data.data
          callback obj, r
        else
          callback obj, null

  function getDiscuss data
    # get discuss
    url = \/api/article/discuss
    q = {}
    if data.aid
      q = t: \query_aid, aid: data.aid
    else
      q = t: \query_mrid, mrid: data.mrid
    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          results = data.data
          results.forEach (result) ->
            getPidInfo result, (obj, data) -> obj.user = data
          $scope.disscussions = results

  $scope.backArticle = ->
    data = do
      t: \back
      aid: $scope.aid
      mrid: $scope.mrid

    $http.post \/api/article/modify, data
      .success (data) ->
        if data instanceof Object and data.status is 100
          window.location.href = \item_view.html?aid= + $scope.aid

  data = get-url-params!

  if data.aid or data.mrid
    # get article
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
          $scope.aid = result.aid
          $scope.mrid = result.mrid
          $scope.abstract = result.abstract
          $scope.articleName = result.name
          $scope.articleContent = result.content
          $scope.categorys = result.categorys
          $scope.timestamp = result.timestamp
          $scope.pid = result.pid
          $scope.is_manager = result.is_manager

          i = 0
          $scope.viewHtml = marked result.content .replace /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g, ->
            '<span id="article_dirs_' + i++ + '"></span>' # add random number to id
          $ '#article_content' .html $scope.viewHtml
          $ '#article_content table' .attr \class, 'table table-bordered'
          $ '#article_content img' .attr \class, 'img-polaroid'

          $scope.updateItems!
          $scope.getModifier!
        else
          window.location.href = \index.html
    getDiscuss data

  else
    # redirect to index.html
    window.location.href = \index.html

  $scope.getModifier = ->
    getPidInfo pid: $scope.pid, is_manager: $scope.is_manager, (obj, data) ->
      if !$scope.is_manager
        $scope.modifier = data.name + ' (Source IP: ' + data.source_ip + ')'
      else
        $scope.modifier = data.name + ' (管理者)'
      $scope.personName = data.name
  
  $scope.getTime = (timestamp) ->
    moment(new Date timestamp).format 'YYYY/MM/DD HH:mm:ss'

  $scope.moveToItem = ($index) ->
    $ 'html, body' .animate { scrollTop: $ \#article_dirs_ + $index .offset!top - 50 }

  $scope.sendDiscuss = ->
    if !$scope.is_manager and $scope.personName.replace /\s/g, '' .length > 0
      url = \/api/user/guest
      q = t: \session, gid: $scope.pid, name: $scope.personName
      $http.get get-url url, q
        .success (data) ->
          console.log data

    if $scope.disscussContent.replace /\s/g, '' .length > 0
      data =
        aid: $scope.aid
        content: $scope.disscussContent

      $http.post \/api/article/discuss, data
        .success (data) ->
          if data instanceof Object and data.status is 100
            $scope.disscussContent = ''
            # 顯示訊息
            getDiscuss aid: $scope.aid

  $scope.deleteThisArticle = ->
    $http.delete \/api/article/item?aid= + $scope.aid
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.redirectToPage \index.html

  $scope.deleteDiscuss = (adid) ->
    $http.delete \/api/article/discuss?adid= + adid
      .success (data) ->
        if data instanceof Object and data.status is 100
          getDiscuss aid: $scope.aid

app.controller item_view