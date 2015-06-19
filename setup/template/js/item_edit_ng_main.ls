init = ($) ->
  $ ->
    # Disable certain links in docs
    $ 'section [href^=#]' .click (e) ->
      e.prevent-default!

    # 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
    $ window .resize ->
      $ window .scrollTop ($ window .scrollTop! + 1)
      
    # Todo
    $ '#article_content table' .attr \class, 'table table-bordered'

init window.jQuery

item_edit = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ""
  $scope.originData = null
  $scope.aid = null
  $scope.items = []
  $scope.itemUpdating = false
  $scope.articleName = ""
  $scope.abstract = ""
  $scope.comment = ""
  $scope.managerSession = false
  $scope.messageErrorAbstract = "摘要不可為空"
  $scope.messageErrorAbstractIsOpen = false
  $scope.messageCommentAbstract = "註解不可為空"
  $scope.messageCommentAbstractIsOpen = false
  $scope.messageSuccessSend = "發送成功！將導向條目頁面。"
  $scope.messageSuccessSendIsOpen = false
  $scope.messageErrorSend = "發送失敗，可能是某些地方輸入錯誤，若沒有發現任何輸入錯誤，請聯絡管理員。"
  $scope.messageErrorSendIsOpen = false
  $scope.categorys = []
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  $scope.loadArticle = (data) ->
    url = \/api/article/ + (if data.aid then \item else \modify)
    q = {}
    if data.aid
      q = t: \query_aid, aid: data.aid
    else
      q = t: \query_mrid, aid: data.mrid
    $http.get get-url url, q
      .success (data) ->
        if data instanceof Object and data.status is 100
          result = data.data

          $scope.originData = result

          $scope.aid = result.aid
          $scope.abstract = result.abstract
          $scope.articleName = result.name
          $scope.categorys = result.categorys
          $scope.timestamp = result.timestamp

          editor.importFile \temp, result.content

          $scope.updateItems!
        else
          window.location.href = \index.html

  data = get-url-params!
  $scope.loadArticle data if data.aid

  $scope.resetArticle = ->
    $scope.abstract = $scope.originData.abstract
    $scope.comment = ''

    editor.importFile \temp, $scope.originData.content
    $scope.updateItems!

  $scope.addItem = ->
    name = $scope.new_item_name
    nameRegex = /^[\u4e00-\u9fa5\-_a-zA-Z0-9]+$/g

    if name is not null and name.match nameRegex

      if $ \.btn.addsubitem_text' .hasClass \active
        if $scope.items.length > 0
          $scope.items.push({ type: 1, val: name});
          editor.getElement \editor .body.innerHTML += '{[[ ' + name + ' ]]}<br />'
          editor.edit!

        $ \.btn.addsubitem_text.button \toggle
      else
        $scope.items.push type: 0, val: name

        editor.getElement \editor .body.innerHTML += '{{{ ' + name + ' }}}<br />'
        editor.edit!

      $scope.itemInit!
      $scope.new_item_name = ''

  $scope.itemInit = ->
    # items number
    ind = 0
    temp = 0
    $scope.items.forEach (item) ->
      if item.type is 0
        item.ind = ++ind
        temp = 0
      else if item.type == 1
        item.ind = ind
        item.subInd = ++temp

  $scope.delItem = (index) ->
    dIndex = $scope.items[index].dIndex
    name = $scope.items[index].proto

    delete $scope.items[index]
    $scope.items.splice index, 1

    # 清除內容中的目錄標記
    content = editor.exportFile!
    editor.importFile \temp, (content.substr 0, dIndex) + content.substr dIndex + name.length

  $scope.updateItems = ->
    content = editor.exportFile!

    dirs = /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g  # title(sub) Regex.
    dirTitle = /{{{ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *}}}/g  # title Regex.
    dirTitleRp = /{{{|}}}| +/g;  # replace
    dirSubTitle = /{\[\[ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *\]\]}/g  # sub title Regex.
    dirSubTitleRp = /{\[\[|\]\]}| +/g;  # replace

    results = content.match dirs
    items = []

    if results is not null
      temp = ''
      dIndex = ''

      results.forEach (result) ->
        dIndex = dIndex = dirs.exec content .index
        if result.match dirTitle
          temp = result.replace dirTitleRp, ''
          items.push type: 0, val: temp, dIndex: dIndex, proto: result
        else if result.match dirSubTitle
          temp = result.replace dirSubTitleRp, ''
          items.push type: 1, val: temp, dIndex: dIndex, proto: result
        else
          console.log \WTF?

    delete $scope.items
    $scope.items = items
    $scope.itemInit!
    $scope.itemUpdating = false

  $scope.moveToItem = (item) ->
    console.log item
    console.log editor

  $scope.itemInit!

  editor.on \update, ->
    if !$scope.itemUpdating
      # 編輯內容被改變，0.5 秒後更新目錄
      $timeout $scope.updateItems, 500
      $scope.itemUpdating = true

  editor.on \edit, ->
    console.log 'edit state.'

  editor.on \preview, ->
    console.log 'preview state.'

    i = 0
    s = marked editor.exportFile! .replace /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g, ->
      '<span id="article_dirs_' + i++ + '"></span>'  # add random number to id

    $ editor.getElement \previewer .getElementById \epiceditor-preview .html s

  function getCtids
    arr = []
    $scope.categorys.forEach (category) ->
      arr.push(category.ctid);
    arr

  $scope.diffArticle = ->
    diffUsingJS 1, (Encoder.htmlDecode $scope.originData.content), editor.exportFile!, \article_diff
    diffUsingJS 1, (Encoder.htmlDecode $scope.originData.abstract), $scope.abstract, \abstract_diff

  $scope.sendModifyArticle = ->
    data =
      t: \modify
      aid: $scope.aid
      abstract: $scope.abstract
      comment: $scope.comment
      content: editor.exportFile!

    $http.post \/api/article/modify, data
      .success (data) ->
      
        if data instanceof Object and data.status is 100
          # 顯示訊息
          $scope.messageSuccessSendIsOpen = true
          $scope.messageErrorSendIsOpen = false
          # 導向 item_view.html#aid=x
          window.location.href = \item_view.html?aid= + $scope.aid
        else
          $scope.messageSuccessSendIsOpen = false
          $scope.messageErrorSendIsOpen = true

app.controller item_edit