var Uub = Uub || {};
Uub.ui = {};

var receive_count = 20;

Uub.ui.make_tableview = function(weibo_type, url, user_id, row_type) {
	var tableview = Titanium.UI.createTableView({
		style : Titanium.UI.iPhone.TableViewStyle.PLAIN,
		headerDividersEnabled: true,
		separatorColor : "#ccc",
		backgroundColor : "white",
		top : 0,
		bottom : 0,
		left : 0,
		right: 0,
		url : url,
		row_type : row_type,
		userid : user_id,
		weibo_type : weibo_type, //all, my, sameage, friend, atme 等等
		_get_type : "first", //获取新数据方式，first: 首次加载,max:获取更新的数据，min:获取更旧的数据
		pulling : false,
		pushing : false,
		page: 1
	});

	var get_more_row = Ti.UI.createTableViewRow({
		height : Ti.UI.SIZE,
		selectedBackgroundColor : '#eee',
		tag : 'get_more',
		textAlign : "center",
		name : 'get_more'
	});

	var get_more_row_center = Ti.UI.createView({
		top : 0,
		bottom : 0,
		width : __l(160),
		height : __l(50),
		touchEnabled : false
	});

	var get_more_title = Ti.UI.createLabel({
		top : __l(12),
		bottom : __l(10),
		left : __l(26),
		right : __l(10),
		textAlign : 'center',
		height : Ti.UI.SIZE,
		font : {
			fontSize : __l(20)
		},
		color : "#999",
		touchEnabled : false,
		text : '获得更多...'
	});
	var navActInd_more = Titanium.UI.createActivityIndicator({
		left : __l(10),
		top : Ti.App.is_android ? __l(16) : __l(14),
		width : __l(20),
		height : __l(20),
		style : Ti.App.is_android ? Titanium.UI.ActivityIndicatorStyle.BIG_DARK : Titanium.UI.iPhone.ActivityIndicatorStyle.DARK
	});

	get_more_row_center.add(navActInd_more);
	get_more_row_center.add(get_more_title);
	get_more_row.add(get_more_row_center);
	
	get_more_row.addEventListener('click', function(e) {
		if (tableview.pushing || tableview.pulling)
			return;

		if (!check_login()) {
			var row_count = get_row_count(tableview);
			if (row_count >= 60) {
				to_login();
				return;
			}
		}

		tableview._get_type = "min";

		tableview.page = tableview.page + 1;
		tableview.url = tableview.url + "&page=" + tableview.page;

		navActInd_more.show();
		tableview.pushing = true;

		tableview.send();
	});

	var xhr = Ti.Network.createHTTPClient();
	tableview.xhr = xhr;
	xhr.timeout = Ti.App.timeout;
	xhr.onerror = function() {
		show_notice("发生错误，您的网络不给力");
		hide_loading();
	};
	xhr.onload = function() {
		navActInd_more.hide();
		
		var json = JSON.parse(this.responseText);
		if (!json || json.length == 0) {
			show_notice("空空如也");
		}

		if (json.length > 0) {
				var row_count = get_row_count(tableview);
				tableview.insert_rows_to_tableview(json);

				if (tableview._get_type == "max" && json.length >= receive_count - 1 || tableview._get_type == "first") {
					if (tableview.userid)
						require('/lib/db').db.insert_json(tableview.weibo_type + "_post", tableview.userid, this.responseText);
				} else if (tableview._get_type == "max" && json.length > 0) {//更新json
					var g_tableview = tableview;
					function add_to_cache() {//这么做可以加快展现速度
						if (!tableview.userid)
							return;
							
						if (tableview.no_cache)
							return;

						var record = require('/lib/db').db.select_one_json(g_tableview.weibo_type + "_post", g_tableview.userid);
						if (!record.blank) {
							var db_json = JSON.parse(record.json);
							db_json = json.concat(db_json);
							db_json.splice(receive_count, receive_count);
							require('/lib/db').db.insert_json(g_tableview.weibo_type + "_post", g_tableview.userid, JSON.stringify(db_json));
						}
					}
					
					add_to_cache();
				}
		}
		

		hide_loading();
		if (tableview.pushing && this.responseText != "null")
			tableview.scrollToIndex(row_count - 1, {
				animated : true,
				position : Ti.UI.iPhone.TableViewScrollPosition.BOTTOM
			});
		if (tableview.pulling && tableview.pull_callback) {
			tableview.pull_callback();	
		} else if (tableview._get_type == "first" && tableview.pull_callback) {
			tableview.pull_callback();
		}
		tableview.pushing = false;
		tableview.pulling = false;
		tableview.newing = false;
		tableview.fireEvent("pullRefreshFinish");
	};

	tableview._header_title = "";
	//显示个人微博的时候对微博进行按月分组，响应主站的时间线
	tableview.insert_rows_to_tableview = function(json) {
		var insert_point = 0;
		var pre_length = get_row_count(this);
		if (this._get_type == "max" && json.length == receive_count) {
			this.data = [];
			//抹掉记录
			insert_point = -1;
			pre_length = 0;
		}

		var json_size = json.length;
		var data = [];
		for (var i = 0; i < json_size; i++) {
			var row = this.make_row_callback(json[i]);
			data.push(row);
		}

		if (this._get_type == "max" && insert_point >= 0 && this.data.length > 0) {
			if (json_size == receive_count && !tableview.no_more) {
				data.push(get_more_row);
			}
			this.setData(data);
		} else {
			if (pre_length == 0) {
				if (json_size == receive_count && !tableview.no_more) {
					data.push(get_more_row);
				}
				this.setData(data);
			} else {
				if (pre_length > 0 && tableview._get_type != "max") {
					var index = tableview.getIndexByName('get_more');
					if (index > 0) {
						navActInd_more.hide();
						tableview.deleteRow(index);
					}
				}
				
				if (json_size == receive_count && !tableview.no_more) {
					data.push(get_more_row);
				}
				tableview.setData(tableview.data.concat(data));
			}
		}

		this.fireEvent("insert.complete");

		if (!Ti.App.is_android)
			hide_loading();
	};

	xhr.send_request = function() {
		json_row = require('/lib/db').db.select_with_check(tableview.weibo_type + "_post", tableview.userid);
		if (!tableview.no_cache && tableview._get_type == "first" && !json_row.blank) {
			var json = JSON.parse(json_row.json);

			tableview.insert_rows_to_tableview(json);
			hide_loading();

			//获得最新
			tableview.send();
		} else {
			xhr.open('GET', tableview.url + "&count=" + receive_count + "&" + account_str());
			xhr.send();
		}
	};

	tableview.send = function() {
		xhr.send_request();
	};

	return tableview;
};

module.exports = Uub;