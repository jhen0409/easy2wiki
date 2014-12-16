var editorDefaultContent = '## Welcome {{{ Welcome }}}\n\nHi, This a demo post of WikiProject.  \n\n## Markdown {{{ Markdown }}}\n\n 這裡使用 Markdown 格式作為條目的主要編輯格式，Markdown 是很方便的文章編寫格式，可以參考 [Wikipedia: Markdown](http://en.wikipedia.org/wiki/Markdown) 與 [GitHub Flavored Markdownn](https://help.github.com/articles/github-flavored-markdown)。\n\n## Image {{{ Image }}}\n\n你可以使用以下的方式來連結一張圖片：(以下是 Markdown 的 logo)\n\n![](https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQaetjv-Jh-uD0ufDi237pU7N4fFQNnnE1YngxI2Ecy3Tr9FWPR)\n\n## code snippet: {{{ Code-Snippet }}}\n\n`inline code`\n\n### Plain Code {[[ Plain-Code ]]}\n\n```puts "Hello World!"\n```\n\n## 表格範例 {{{ Table }}}\n\n| Tables        | Are           | Cool  |\n| ------------- |:-------------:| -----:|\n| col 1         | Hello         | $1600 |\n| col 2         | Hello         |   $12 |\n| col 3         | Hello         |    $1 |';

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

var item_new = ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
	$scope.managerSession = false;
	$scope.searchText = "";
	$scope.items = [];
	$scope.itemUpdating = false;
	$scope.articleName = "";
	$scope.abstract = "";
	$scope.messageErrorName = "";
	$scope.messageErrorNameIsOpen = false;
	$scope.messageSuccessName = "";
	$scope.messageSuccessNameIsOpen = false;
	$scope.messageErrorAbstract = "摘要不可為空";
	$scope.messageErrorAbstractIsOpen = false;
	$scope.messageSuccessSend = "發送成功！將導向條目頁面。";
	$scope.messageSuccessSendIsOpen = false;
	$scope.messageErrorSend = "發送失敗，可能是某些地方輸入錯誤，若沒有發現任何輸入錯誤，請聯絡管理員。";
	$scope.messageErrorSendIsOpen = false;

	$scope.categorys = [];
	$scope.categoryTypeahead = "";

	$scope.searchArticle = function() {
		if ($scope.searchText != "") {
			window.location.href = 'item_list.html?t=query_kw&keywd=' + $scope.searchText;
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

	$scope.redirectToPage = function(url) {
		window.location.href = url;
	};

	$scope.logout = function() {
		$http.post('/api/user/manager?t=logout')
			.success(function(data) {

				$scope.redirectToPage('index.html');
			}
		);
	}

	$scope.resetArticle = function() {
		$scope.articleName = '';
		$scope.abstract = '';

		editor.importFile('temp', editorDefaultContent);

		$scope.updateItems();
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

	$scope.newArticleChange = function() {
		$http.get('/api/article/item?t=exist&name=' + $scope.articleName)
			.success(function(data) {
	  		console.log(data);
				var result = [];

				if (data instanceof Object && data.status == 100) {
					$scope.messageSuccessName = "名稱可以使用！"
					$scope.messageErrorNameIsOpen = false;
					$scope.messageSuccessNameIsOpen = true;
				} else {
					$scope.messageErrorName = "名稱重複！"
					$scope.messageErrorNameIsOpen = true;
					$scope.messageSuccessNameIsOpen = false;
				}
			});
	}

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

	$scope.addCategory = function(ctid, name) {
		
		//判斷重複
		for (var i = 0; i < $scope.categorys.length; i++) {
			if ($scope.categorys[i].ctid == ctid) {
				return;
			}
		}

		$scope.categorys.push({ ctid: ctid, name: name});
	};

	$scope.deleteCategory = function(cate) {
		for (var i = 0; i < $scope.categorys.length; i++) {
			if ($scope.categorys[i] == cate) {
				delete $scope.categorys[i];
				$scope.categorys.splice(i,1);
			}
		}
	};

	var map = {};

	$scope.categoryTah = [];

  $scope.$on('typeahead-updated', function() {
    console.log('Value selected ' + $scope.categoryTypeahead);

    $scope.addCategory(map[$scope.categoryTypeahead].ctid, map[$scope.categoryTypeahead].name);

    $timeout(function() {
    	$scope.categoryTypeahead = "";
    }, 50);

    $scope.$digest();
  });
  
  $scope.$watch('categoryTypeahead', function(newValue, oldValue) {
  	$http.get('/api/category/item?t=query_kw&keywd=' + newValue)
			.success(function(data) {
				console.log(data);
				var result = [];

				if (data instanceof Object && data.status == 100) {
					var r = data.data;
					$.each(r, function (i, item) {
						map[item.name] = item;
						result.push(item.name);
					});
					$scope.categoryTah = result;
				} else {

				}
			});
  });

  function getCtids() {
  	var arr = [];
  	for (var i = 0; i < $scope.categorys.length; i++) {
  		arr.push($scope.categorys[i].ctid);
  	}
  	return arr;
  }

  $scope.sendNewArticle = function() {
  	if (!$scope.messageErrorNameIsOpen) {
  		var data = {
  				name: $scope.articleName,
  				abstract: $scope.abstract, 
  				content: editor.exportFile(),
  				ctids: getCtids()
  			};

  		console.log(data);
  		$http.post('/api/article/item', data
  		).success(function(data) {
				
				if (data instanceof Object && data.status == 100) {
					// 顯示訊息

					$scope.messageSuccessSendIsOpen = true;
					$scope.messageErrorSendIsOpen = false;

					// 導向 item_view.html#aid=x

					window.location.href = 'item_view.html?aid=' + data.data.aid;

				} else {
					$scope.messageSuccessSendIsOpen = false;
					$scope.messageErrorSendIsOpen = true;
				}
			});
  	}
  };

}];

app.controller(item_new);