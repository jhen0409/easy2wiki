!function($) {

  $(function() {
		// Disable certain links in docs
		$('section [href^=#]').click(function(e) {
			e.preventDefault();
		});

		// 暫時解決 sidenav 在最底部，視窗寬度縮小至 767 down 時，會與內容發生重疊的問題(移一下捲軸解決它...)
		$(window).resize(function() {
			$(window).scrollTop($(window).scrollTop() + 1);
		});

		// Todo
		$('#article_content table').attr('class', 'table table-bordered');
  });

}(window.jQuery);

var item_edit = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
	$scope.managerSession = false;
	$scope.searchText = "";
	$scope.originData = null;
	$scope.aid = null;
	$scope.items = [];
	$scope.itemUpdating = false;
	$scope.articleName = "";
	$scope.abstract = "";
	$scope.comment = "";
	$scope.managerSession = false;
	$scope.messageErrorAbstract = "摘要不可為空";
	$scope.messageErrorAbstractIsOpen = false;
	$scope.messageCommentAbstract = "註解不可為空";
	$scope.messageCommentAbstractIsOpen = false;
	$scope.messageSuccessSend = "發送成功！將導向條目頁面。";
	$scope.messageSuccessSendIsOpen = false;
	$scope.messageErrorSend = "發送失敗，可能是某些地方輸入錯誤，若沒有發現任何輸入錯誤，請聯絡管理員。";
	$scope.messageErrorSendIsOpen = false;
	$scope.categorys = [];

	$scope.searchArticle = function() {
		if ($scope.searchText != "") {
			window.location.href = 'item_list.html?t=query_kw&keywd=' + searchText;
		}
	}

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

	$scope.loadArticle = function(data) {
		$http.get('/api/article/' + (data.aid ? 'item' : 'modify') +
				'?t=query_' +
				(data.aid ? 'aid&aid=' + data.aid : 'mrid&mrid=' + data.mrid))
		.success(function(data) {
			console.log(data);
			
			if (data instanceof Object && data.status == 100) {
				var result = data.data;

				$scope.originData = result;

				$scope.aid = result.aid;
				$scope.abstract = result.abstract;
				$scope.articleName = result.name;
				$scope.categorys = result.categorys;
				$scope.timestamp = result.timestamp;

				editor.importFile('temp', result.content);

				$scope.updateItems();
			} else {
				window.location.href = 'index.html';
			}
  	});
	};

	$scope.resetArticle = function() {
		$scope.abstract = $scope.originData.abstract;
		$scope.comment = '';

		editor.importFile('temp',  $scope.originData.content);
		$scope.updateItems();
	}

	var hash = window.location.search.slice(1);
	var array = hash.split("&");
	var data = {};

	for (var i = 0; i < array.length; i++) {
		var values = array[i].split("=");
		data[values[0]] = values[1];
	}

	if (data.aid) {
		$scope.loadArticle(data);
	}

	$scope.addItem = function() {
		var name = $scope.new_item_name;
		var nameRegex = /^[\u4e00-\u9fa5\-_a-zA-Z0-9]+$/g;

		if (name != null && name.match(nameRegex)) {

			if ($('.btn.addsubitem_text').hasClass('active')) {
				if ($scope.items.length > 0) {
					$scope.items.push({ type: 1, val: name});
					editor.getElement('editor').body.innerHTML += '{[[ ' + name + ' ]]}<br>';
					editor.edit();
				}

				$('.btn.addsubitem_text').button('toggle');
			} else {
				$scope.items.push({ type: 0, val: name});

				editor.getElement('editor').body.innerHTML += '{{{ ' + name + ' }}}<br>';
				editor.edit();
			}
			$scope.itemInit();
			$scope.new_item_name = "";
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

	$scope.delItem = function(index) {
		var dIndex = $scope.items[index].dIndex;
		var name = $scope.items[index].proto;

		delete $scope.items[index];
		$scope.items.splice(index, 1);

		// 清除內容中的目錄標記
		var content = editor.exportFile();
		editor.importFile('temp', content.substr(0, dIndex) + content.substr(dIndex + name.length));
	}

	$scope.updateItems = function() {
		var content = editor.exportFile();

		var dirs = /{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g;	// title(sub) Regex.
		var dirTitle = /{{{ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *}}}/g;	// title Regex.
		var dirTitleRp = /{{{|}}}| +/g;	// replace
		var dirSubTitle = /{\[\[ *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *\]\]}/g;	// sub title Regex.
		var dirSubTitleRp = /{\[\[|\]\]}| +/g;	// replace

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
		$scope.itemUpdating = false;
	}

	$scope.moveToItem = function(item) {
		console.log(item);
		console.log(editor);

	}

	$scope.itemInit();

	editor.on('update', function() {
		if (!$scope.itemUpdating) {
			// 編輯內容被改變，0.5 秒後更新目錄
			$timeout($scope.updateItems, 500);
			$scope.itemUpdating = true;
		}
	});

	editor.on('edit', function() {
		console.log('edit state.');
	});

	editor.on('preview', function() {
		console.log('preview state.');

		var i = 0;
		var s = marked(editor.exportFile()).replace(/{({{|\[\[) *[\u4e00-\u9fa5\-_a-zA-Z0-9]+ *(}}|\]\])}/g, function() {
			return "<span id=\"article_dirs_" + i++ + "\"></span>";	// add random number to id
		});

		$(editor.getElement('previewer').getElementById("epiceditor-preview")).html(s);
	});

  function getCtids() {
  	var arr = [];
  	for (var i = 0; i < $scope.categorys.length; i++) {
  		arr.push($scope.categorys[i].ctid);
  	}
  	return arr;
  }

  $scope.diffArticle = function() {
  	diffUsingJS(1, Encoder.htmlDecode($scope.originData.content), editor.exportFile(), 'article_diff');
  	diffUsingJS(1, Encoder.htmlDecode($scope.originData.abstract), $scope.abstract, 'abstract_diff');
  };

  $scope.sendModifyArticle = function() {
  	
		var data = {
				t: 'modify',
				aid: $scope.aid,
				abstract: $scope.abstract, 
				comment: $scope.comment,
				content: editor.exportFile()
			};

		console.log(data);
		$http.post('/api/article/modify', data
		).success(function(data) {
			
			if (data instanceof Object && data.status == 100) {
				// 顯示訊息

				$scope.messageSuccessSendIsOpen = true;
				$scope.messageErrorSendIsOpen = false;

				// 導向 item_view.html#aid=x

				window.location.href = 'item_view.html?aid=' + $scope.aid;

			} else {
				$scope.messageSuccessSendIsOpen = false;
				$scope.messageErrorSendIsOpen = true;
			}
		});
  };

}];

app.controller(item_edit);