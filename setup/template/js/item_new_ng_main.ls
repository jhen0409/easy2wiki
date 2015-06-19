editorDefaultContent = '''
  ## Welcome {{{ Welcome }}}

  Hi, This a demo post of WikiProject.  

  ## Markdown {{{ Markdown }}}

  這裡使用 Markdown 格式作為條目的主要編輯格式，Markdown 是很方便的文章編寫格式，可以參考 [Wikipedia: Markdown](http://en.wikipedia.org/wiki/Markdown) 與 [GitHub Flavored Markdownn](https://help.github.com/articles/github-flavored-markdown)。

  ## Image {{{ Image }}}\n\n你可以使用以下的方式來連結一張圖片：(以下是 Markdown 的 logo)

  ![](https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQaetjv-Jh-uD0ufDi237pU7N4fFQNnnE1YngxI2Ecy3Tr9FWPR)

  ## code snippet: {{{ Code-Snippet }}}

  `inline code`

  ### Plain Code {[[ Plain-Code ]]}

  ```puts "Hello World!"
  ```

  ## 表格範例 {{{ Table }}}

  | Tables        | Are           | Cool  |
  | ------------- |:-------------:| -----:|
  | col 1         | Hello         | $1600 |
  | col 2         | Hello         |   $12 |
  | col 3         | Hello         |    $1 |
'''

init = ($) ->
  $ ->
    # Disable certain links in docs
    $ 'section [href^=#]' .click (e) ->
      e.prevent-default!

    # 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
    $ window .resize ->
      $ window .scrollTop $ window .scrollTop! + 1

    # side bar
    setTimeout do
      ->
        $ '.bs-docs-sidenav' .affix do
          offset:
            top: -> if $ window .width! <= 980 then 290 else 210
            bottom: 270
        $ window .scrollTop $ window .scrollTop! + 1
        $ window .scrollTop $ window .scrollTop! - 1
      100

    # Todo
    $ '#article_content table' .attr \class, 'table table-bordered'

init window.jQuery

item_new = ($scope, $http, $timeout) ->
  $scope.managerSession = false
  $scope.searchText = ''
  $scope.items = []
  $scope.itemUpdating = false
  $scope.articleName = ''
  $scope.abstract = ''
  $scope.messageErrorName = ''
  $scope.messageErrorNameIsOpen = false
  $scope.messageSuccessName = ''
  $scope.messageSuccessNameIsOpen = false
  $scope.messageErrorAbstract = '摘要不可為空'
  $scope.messageErrorAbstractIsOpen = false
  $scope.messageSuccessSend = '發送成功！將導向條目頁面。'
  $scope.messageSuccessSendIsOpen = false
  $scope.messageErrorSend = '發送失敗，可能是某些地方輸入錯誤，若沒有發現任何輸入錯誤，請聯絡管理員。'
  $scope.messageErrorSendIsOpen = false

  $scope.categorys = []
  $scope.categoryTypeahead = ''
  $scope.search-article = get-search-text $scope
  $scope.redirect-to-page = get-redirect-to-page!
  $scope.logout = get-logout $scope, $http

  # check manager session
  check-session $scope, $http

  $scope.resetArticle = ->
    $scope.articleName = ''
    $scope.abstract = ''

    editor.importFile \temp, editorDefaultContent
    $scope.updateItems!

  $scope.addItem = ->
    name = $scope.new_item_name
    nameRegex = /^[\u4e00-\u9fa5\-_a-zA-Z0-9]+$/g

    if name is not null and name.match nameRegex
      if $ \.btn.addsubitem_text .hasClass \active
        if $scope.items.length > 0
          $scope.items.push type: 1, val: name
          editor.getElement \editor .body.innerHTML += '{[[ ' + name + ' ]]}<br />'
          editor.edit!

        $ \.btn.addsubitem_text .button \toggle
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
        temp = 0;
      else if item.type is 1
        item.ind = ind
        item.subInd = ++temp

  $scope.delItem = (index) ->
    dIndex = $scope.items[index].dIndex
    name = $scope.items[index].proto

    delete $scope.items[index]
    $scope.items.splice(index, 1)

    # 清除內容中的目錄標記
    content = editor.exportFile!
    editor.importFile \temp, (content.substr 0, dIndex) + content.substr dIndex + name.length

  $scope.updateItems = ->
    content = editor.exportFile!

    dirs = /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g  # title(sub) Regex.
    dirTitle = /{{{ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *}}}/g  # title Regex.
    dirTitleRp = /{{{|}}}| +/g  # replace
    dirSubTitle = /{\[\[ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *\]\]}/g; # sub title Regex.
    dirSubTitleRp = /{\[\[|\]\]}| +/g  # replace

    results = content.match dirs
    items = [];

    if results is not null
      temp = 0
      dIndex = 0
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

  $scope.newArticleChange = ->
    $http.get get-url \/api/article/item, t: \exist, name: $scope.article-name
      .success (data) ->
        if data instanceof Object and data.status is 100
          $scope.messageSuccessName = '名稱可以使用！'
          $scope.messageErrorNameIsOpen = false
          $scope.messageSuccessNameIsOpen = true
        else
          $scope.messageErrorName = '名稱重複！'
          $scope.messageErrorNameIsOpen = true
          $scope.messageSuccessNameIsOpen = false

  editor.on \edit, ->
    console.log 'edit state.'

  editor.on \preview, ->
    console.log 'preview state.'

    i = 0
    s = marked editor.exportFile! .replace /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g, ->
      "<span id=\"article_dirs_" + i++ + "\"></span>";  # add random number to id

    $ editor.getElement \previewer .getElementById \epiceditor-preview .html s

  $scope.addCategory = (ctid, name) ->
    # 判斷重複
    for category in $scope.categorys
      if category.ctid is ctid
        return

    $scope.categorys.push ctid: ctid, name: name

  $scope.deleteCategory = (cate) ->
    for i, category of $scope.categorys
      if $scope.categorys[i] is cate
        delete $scope.categorys[i]
        $scope.categorys.splice i, 1

  map = {}
  $scope.categoryTah = []

  $scope.$on \typeahead-updated, ->
    console.log 'Value selected ' + $scope.categoryTypeahead

    $scope.addCategory map[$scope.categoryTypeahead].ctid, map[$scope.categoryTypeahead].name
    $timeout do
      -> $scope.categoryTypeahead = ''
      50
    $scope.$digest!
  
  $scope.$watch \categoryTypeahead, (newValue, oldValue) ->
    $http.get get-url \/api/category/item, t: \query_kw, keywd: newValue
      .success (data) ->
        result = []
        if data instanceof Object and data.status is 100
          r = data.data
          $.each r, (i, item) ->
            map[item.name] = item
            result.push item.name
          $scope.categoryTah = result

  function get-ctids
    arr = []
    $scope.categorys.for-each (category) ->
      arr.push category.ctid
    arr

  $scope.sendNewArticle = ->
    if !$scope.messageErrorNameIsOpen
      data =
        name: $scope.articleName
        abstract: $scope.abstract
        content: editor.exportFile!
        ctids: getCtids!

      $http.post \/api/article/item, data
        .success (data) ->
          if data instanceof Object and data.status is 100
            # 顯示訊息
            $scope.messageSuccessSendIsOpen = true
            $scope.messageErrorSendIsOpen = false
            # 導向 item_view.html#aid=x
            window.location.href = \item_view.html?aid= + data.data.aid
          else
            $scope.messageSuccessSendIsOpen = false
            $scope.messageErrorSendIsOpen = true

app.controller item_new