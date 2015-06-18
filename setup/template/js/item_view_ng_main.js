!function($) {

  $(function() {

    // Disable certain links in docs
    $('section [href^=#]').click(function(e) {
      e.preventDefault()
    });

    // 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
    $(window).resize(function() {
      $(window).scrollTop($(window).scrollTop() + 1);
    });

    // side bar
    setTimeout(function () {
      $('.bs-docs-sidenav').affix({
        offset: {
          top: function () { return $(window).width() <= 980 ? 290 : 210 }, 
          bottom: 270
        }
      })
      $(window).scrollTop($(window).scrollTop() + 1);
      $(window).scrollTop($(window).scrollTop() - 1);
    }, 100);

    // Todo
    $('#article_content table').attr('class', 'table table-bordered');
    $('#article_content img').attr('class', 'img-polaroid');
  });

}(window.jQuery)

var item_view = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.managerSession = false;
  $scope.searchText = "";
  $scope.aid = null;
  $scope.mrid = null;
  $scope.items = [];
  $scope.abstract = "";
  $scope.articleName = "";
  $scope.articleContent = "";
  $scope.viewHtml = "";
  $scope.timestamp = 0;
  $scope.categorys = [];
  $scope.guestName = "";
  $scope.disscussContent = "";
  $scope.disscussions = [];
  $scope.modifier = "";
  $scope.modifierName = "";
  $scope.personName = "";
  $scope.pid = 0;
  $scope.is_manager = false;

  // check manager session
  $http.get('/api/user/manager?t=check_session')
    .success(function(data) {
      var result = [];

      if (data instanceof Object && data.status == 100) {
        $scope.managerSession = true;
      } else {
        $scope.managerSession = false;
      }
    }
  );

  $scope.logout = function() {
    $http.post('/api/user/manager?t=logout')
      .success(function(data) {

        $scope.redirectToPage('index.html');
      }
    );
  }

  $scope.searchArticle = function() {
    if ($scope.searchText != "") {
      window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
    }
  }

  $scope.itemInit = function() {
    // items number
    var ind = 0;
    var temp = 0;
    for (var i = 0; i < $scope.items.length; i++) {
      if ($scope.items[i].type == 0) {
        $scope.items[i].ind = ++ind;
        temp = 0;
      } else if ($scope.items[i].type == 1) {
        $scope.items[i].ind = ind;
        $scope.items[i].subInd = ++temp;
      }
    }
  }

  $scope.updateItems = function() {
    var content = $scope.articleContent;

    var dirs = /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g;  // title(sub) Regex.
    var dirTitle = /{{{ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *}}}/g;  // title Regex.
    var dirTitleRp = /{{{|}}}| +/g;  // replace
    var dirSubTitle = /{\[\[ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *\]\]}/g;  // sub title Regex.
    var dirSubTitleRp = /{\[\[|\]\]}| +/g;  // replace

    var result = content.match(dirs);
    var items = [];

    if (result != null) {
      var temp;
      var dIndex;
      for (var i = 0; i < result.length; i++) {
        dIndex = dIndex = dirs.exec(content).index;
        if (result[i].match(dirTitle)) {
          temp = result[i].replace(dirTitleRp, '');
          items.push({ type: 0, val: temp, dIndex: dIndex, proto: result[i] });
        } else if (result[i].match(dirSubTitle)) {
          temp = result[i].replace(dirSubTitleRp, '');
          items.push({ type: 1, val: temp, dIndex: dIndex, proto: result[i] });
        } else {
          console.log('WTF?');
        }
      }
    }

    delete $scope.items;
    $scope.items = items;
    $scope.itemInit();
  }

  function getPidInfo(obj, callback) {
    $http.get('/api/user/' + (obj.is_manager ? 'manager' : 'guest')
         + '?t=info&' + (obj.is_manager ? 'mid' : 'gid') + '=' + obj.pid)
      .success(function(data) {
        console.log(data);
        if (data instanceof Object && data.status == 100) {
          var r = data.data;
          callback(obj, r);
        } else {
          callback(obj, null);
        }
      });
  };

  function getDiscuss(data) {
    // get discuss

    $http.get('/api/article/discuss?t=query_' +
        (data.aid ? 'aid&aid=' + data.aid : 'mrid&mrid=' + data.mrid))
    .success(function(data) {
      console.log(data);
      
      if (data instanceof Object && data.status == 100) {
        var result = data.data;

        for (var i = 0; i < result.length; i++) {
          getPidInfo(result[i], function(obj, data) {
            console.log(obj);
            obj.user = data;
          });
        }
        $scope.disscussions = result;
        console.log($scope.disscussions);
      } else {

      }
    });
  }

  $scope.backArticle = function() {
    
    var data = {
        t: 'back',
        aid: $scope.aid,
        mrid: $scope.mrid
      };

    console.log(data);
    $http.post('/api/article/modify', data
    ).success(function(data) {
      
      if (data instanceof Object && data.status == 100) {

        window.location.href = 'item_view.html?aid=' + $scope.aid;

      } else {
        
      }
    });
  };

  var hash = window.location.search.slice(1);
  var array = hash.split("&");
  var data = {};

  for (var i = 0; i < array.length; i++) {
    var values = array[i].split("=");
    data[values[0]] = values[1];
  }

  if (data.aid || data.mrid) {

    // get article
    $http.get('/api/article/' + (data.aid ? 'item' : 'modify') +
        '?t=query_' +
        (data.aid ? 'aid&aid=' + data.aid : 'mrid&mrid=' + data.mrid))
    .success(function(data) {
      console.log(data);
      
      if (data instanceof Object && data.status == 100) {
        var result = data.data;
        $scope.aid = result.aid;
        $scope.mrid = result.mrid;
        $scope.abstract = result.abstract;
        $scope.articleName = result.name;
        $scope.articleContent = result.content;
        $scope.categorys = result.categorys;
        $scope.timestamp = result.timestamp;
        $scope.pid = result.pid;
        $scope.is_manager = result.is_manager;

        var i = 0;
        $scope.viewHtml = marked(result.content).replace(/{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g, function() {
          return "<span id=\"article_dirs_" + i++ + "\"></span>";  // add random number to id
        });
        $('#article_content').html($scope.viewHtml);
        $('#article_content table').attr('class', 'table table-bordered');
        $('#article_content img').attr('class', 'img-polaroid');

        $scope.updateItems();

        $scope.getModifier();
      } else {
        window.location.href = 'index.html';
      }
    });

    getDiscuss(data);

  } else {
    // redirect to index.html
    window.location.href = 'index.html';
  }

  $scope.getModifier = function() {
    getPidInfo({ pid: $scope.pid, is_manager: $scope.is_manager}, function(obj, data) {

      if (!$scope.is_manager) {

        $scope.modifier = data.name + ' (Source IP: ' + data.source_ip + ')';
      } else {
        $scope.modifier = data.name + ' (管理者)';
      }
      $scope.personName = data.name;
      
    })
  };
  
  $scope.getTime = function(timestamp) {
    return moment(new Date(timestamp)).format("YYYY/MM/DD HH:mm:ss");
  };
  
  $scope.moveToItem = function($index) {
    $('html, body').animate({ scrollTop: $('#article_dirs_' + $index).offset().top - 50 });
  };

  $scope.redirectToPage = function(url) {
    // 導向 article_list.html?ctid=x
    window.location.href = url;
  };

  $scope.sendDiscuss = function() {
    console.log($scope.personName);
    if (!$scope.is_manager && $scope.personName.replace(/\s/g, '').length > 0) {
      $http.get('/api/user/guest?t=session&gid=' + $scope.pid + '&name=' + $scope.personName)
      .success(function(data) {
        console.log(data);
      });
    }
    if ($scope.disscussContent.replace(/\s/g, '').length > 0) {

      var data = {
          aid: $scope.aid,
          content: $scope.disscussContent
        };

      $http.post('/api/article/discuss', data)
        .success(function(data) {
          console.log(data);
          if (data instanceof Object && data.status == 100) {
            // 顯示訊息

            getDiscuss({ aid: $scope.aid });
          } else {
            
          }
        });
    } else {

    }
  };

  $scope.deleteThisArticle = function() {
    $http.delete('/api/article/item?aid=' + $scope.aid)
      .success(function(data) {
        console.log(data);
        if (data instanceof Object && data.status == 100) {
          $scope.redirectToPage('index.html');
        } else {
          
        }
      });
  };

  $scope.deleteDiscuss = function(adid) {
    $http.delete('/api/article/discuss?adid=' + adid)
      .success(function(data) {
        console.log(data);
        if (data instanceof Object && data.status == 100) {
            getDiscuss({ aid: $scope.aid });
        } else {
            
        }
      });
  };

}];

app.controller(item_view);

