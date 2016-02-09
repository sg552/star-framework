function logEvent(event, params){
	Ti.App.fireEvent("flurry_event", {event: event, params: params});
}

function __l(x){
	if (Ti.App.is_android){
		 if (Ti.App.platform_height/Ti.App.logicalDensityFactor > 800)
			return x * Ti.App.logicalDensityFactor * 1.4;
		else
			return x * Ti.App.logicalDensityFactor;

		 //return parseInt(Ti.App.platform_width*x/(Ti.App.logicalDensityFactor == 1 ? 360 : 320));
	}

	if (!Ti.App.is_android && !Ti.App.is_ipad && Ti.App.platform_width > 320){
		return parseInt(375.0*x/320);
	}

	return Ti.App.is_ipad ? 1.5*x : x;
}

//清除窗体上的所有子窗体
function clear_window(win){
	if (!win)
		return;

	//scrollableviews
	if (win.views && win.views.length > 0){
		for(var i=win.views.length-1; i>=0; i--){
			clear_window(win.views[i])
		}
		win = null;
		return;
	}

	//window or view
	if (win.children){
		for(var i=win.children.length-1; i>=0; i--){
			var t = win.children[i]
			if (t)
				win.remove(t)
		}
	}
}

//判断是否登陆
function check_login() {
	if(Ti.App.Properties.getString("userid", "").length > 0)
		return true;
	else
		return false;
}

function to_login(){
	Ti.App.util.show_window(Ti.App.code_url + "/code/login.js", {
		title: "登录"
	});
}

//创建超时对话框
function show_timeout_dlg(xhr, url) {
	if (Ti.App.is_android)
		return;

	var a = Titanium.UI.createAlertDialog({
		title : '提示',
		message : '获取数据超时'
	});
	a.addEventListener("click", function(e) {
		if(e.index == 0) {//重试
			xhr.open('GET', url);
			xhr.send();
		} else {//取消
			Titanium.App.fireEvent('hide_indicator');
		}
	});
	a.buttonNames = ['重试', '取消'];
	a.show();
}

function referMinute(str){
	if (typeof(str) == "undefined")
		return "";

	var now = new Date().getTime();
	var t = new Date(str);

	var minutes = parseInt((now - t.getTime()) / (1000 * 60));		//中国偏离8个小时的时差
	var hour = parseInt(minutes / 60);
	var day = parseInt(hour / 24);

	if (day == 0){
		if (hour == 0){
			if (minutes<3){
				return "刚刚";
			}
			else{
				return minutes + "分钟前";
			}
		}
		else{
			return hour + "小时前";
		}
	}
	else if (day == 1){
		return "昨天" + (t.getHours() < 10 ? "0" + t.getHours() : t.getHours()) + ":" + (t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes());
	}
	else if (day < 30){
		return (t.getMonth()+1) + "月" + t.getDate() + "日 " + (t.getHours() < 10 ? "0" + t.getHours() : t.getHours()) + ":" + (t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes());
	}

	return t.getFullYear() + "年" + (t.getMonth()+1) + "月" + t.getDate() + "日 " + (t.getHours() < 10 ? "0" + t.getHours() : t.getHours()) + ":" + (t.getMinutes() < 10 ? "0" + t.getMinutes() : t.getMinutes());
}

/**
 * options:
 *   url: 远程代码的url, 例如： http://myserver.com/code/user.js
 *   cache: 是否使用缓存。  可用值：true/false
 *   success: 成功后的callback, 一般是 eval(response.text)
 */
function http_call(options){
	if (options.cache){			//缓存
		if (Ti.App.deployType == "production"){
			var record = require('/lib/db').db.select_with_check(options.url, 0);
			if (record.blank){		//没有命中
				//啥也不干，等着后面处理
			}
			else{					//命中了
				if (options.success)
					options.success({responseText: record.json});

				return;
			}
		}
	}
	var xhr = Ti.Network.createHTTPClient();
	xhr.timeout = Ti.App.timeout;
	xhr.cache = false;
	xhr.onerror = function() {
		if (options.error)
			options.error(this);
		else
			show_timeout_dlg(xhr, options.url);
	};
	xhr.onload = function() {
		if (options.success)
			options.success(this);

		if (options.cache)
			require('/lib/db').db.insert_json(options.url, 0, this.responseText);
	};
	var url = options.url;
	if (options.url.indexOf(Ti.App.host_url) == 0){
		var append = "__osname="+Ti.App.osname+"&__osversion="+Ti.App.osversion+"&__appversion="+Ti.App.version+"&__manufacturer="+Ti.App.manufacturer+"&__model="+Ti.App.model+"&__memory="+Ti.Platform.availableMemory;
		url += options.url.indexOf("?") > 0 ? "&" + append : "?" + append;
	}

	xhr.open(options.method || 'GET', url);
	if (options.args){
		xhr.send(options.args);
	}
	else{
		xhr.send();
	}
}
/*
function http_call(url, load_callback, error_callback, method, args){
	var xhr = Ti.Network.createHTTPClient();
	xhr.timeout = Ti.App.timeout;
	xhr.cache = false;
	xhr.onerror = function() {
		if (error_callback)
			error_callback(this);
		else
			show_timeout_dlg(xhr, url);
	};
	xhr.onload = function() {
		if (load_callback)
			load_callback(this);
	};
	if (url.indexOf(Ti.App.host_url) == 0){
		var append = "osname="+Ti.App.osname+"&osversion="+Ti.App.osversion+"&appversion="+Ti.App.version+"&manufacturer="+Ti.App.manufacturer+"&model="+Ti.App.model+"&memory="+Ti.Platform.availableMemory;
		url += url.indexOf("?") > 0 ? "&" + append : "?" + append;
	}

	xhr.open(method || 'GET', url);
	if ((method == "POST" || method == "PUT" || method == "DELETE") && args){
		xhr.send(args);
	}
	else{
		xhr.send();
	}
}
*/

function cache_http_call(url, tag, loading_callback, error_callback){
	if (Ti.App.deployType == "production"){
		var record = require('/lib/db').db.select_with_check(tag, 0);
		if (record.blank){
			http_call(url, function(e){
				loading_callback(e);
				require('/lib/db').db.insert_json(tag, 0, e.responseText);
			}, error_callback);
		}
		else{
			loading_callback({responseText: record.json});
		}
	}
	else{
		http_call(url, function(e){
			loading_callback(e);
		}, error_callback);
	}

	return;
}

function account_str(){
	var str = "";
	if (!check_login()){
		str += "login=false";
		return str;
	}

	str = "tp=" + Ti.App.Properties.getString("tp", "") + "&token=" + Ti.App.Properties.getString("token", "") + "&mobile=" + Ti.App.Properties.getString("mobile", "");

	return decodeURI(str);
}

function show_window(file, attr){
	if (!attr)
		attr = {};

	var win = null;
	attr.backgroundColor |= "white";
	attr.backButtonTitle |= '';

	if (file.indexOf(".js") > 0){
		win = Titanium.UI.createWindow(attr);
		win.url = file;
	}
	else{
		var NewWin = require(file);
		win = new NewWin(attr);
	}

	win.backButtonTitle = "";
	win.backgroundColor = "white";

	if (!Ti.App.is_android) {
		win.hideTabBar();
	}

	add_default_action_bar(win, win.title);

	if (Ti.App.is_android){
		win.open();
	}
	else{
		Ti.App.currentTabGroup.activeTab.open(win, {
			animated : true
		});
	}

	return win;
}

//获得tableview的总行数
function get_row_count(tableview) {
	var total = 0;
	for(var i = 0; i < tableview.data.length; i++) {
		total = total + tableview.data[i].rowCount;
	}
	return total;
}

//关闭正在加载
function hide_loading() {
	Titanium.App.fireEvent('hide_indicator');
}

function add_default_action_bar(win, title){
	if (!Ti.App.is_android)
		return;

	function open_(){
			if (! win.activity) {
	            Ti.API.error("Can't access action bar on a lightweight window.");
	        } else {
	            actionBar = win.activity.actionBar;
	            if (actionBar) {
	                //actionBar.backgroundImage = "/images/actionbg.png";
	                actionBar.title = win.title || "";
	               	actionBar.displayHomeAsUp = true;
	                actionBar.onHomeIconItemSelected = function() {
	                	if (!win.no_back)
	                    	win.close();
	                };
	            }
	        }
		}
	if (win.activity && win.activity.actionBar)
		open_();
	else
		win.addEventListener("open", open_);
	return;
}

function add_default_action_bar2(win, title, button_title, button_function, noback){
	if (!Ti.App.is_android)
		return;

	win.activity.onCreateOptionsMenu = function(e) {
	                	var item;
			            if (typeof button_title == "number" || button_title.indexOf("/images") >= 0){
			            	item = e.menu.add({
				            	icon: button_title,
				            	showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
				            });
				            item.addEventListener("click", function(e){
				            	button_function();
				            });
			            }
			            else{
			            	var wrapper = Titanium.UI.createView({
									top : 0,
									bottom : 1,
									height: Ti.UI.FILL
							});
							var button = Ti.UI.createButton({
								title : button_title,
								backgroundColor: "transparent",
								backgroundSelectedColor: "#eee",
								//backgroundSelectedImage : "/images/bj2.png",
								font: {fontSize: __l(15)},
								top: 0,
								bottom: 0,
								borderRadius: __l(0),
								color: Ti.App.bar_color,
								horizontalWrap: false
							});
							button.addEventListener("click", function(e){
								button_function();
							});
							wrapper.add(button);

							var item = e.menu.add({
					        	title: button_title,
								showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
							});
							item.actionView = wrapper;
			            	/*
			            	item = e.menu.add({
				            	title: button_title,
				            	showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS,
				            });
				            */
			            }
	};

	function open_() {
			if (! win.activity) {
	            Ti.API.error("Can't access action bar on a lightweight window.");
	        } else {
	            actionBar = win.activity.actionBar;
	            if (actionBar) {
	                actionBar.backgroundImage = "/images/actionbg.png";
	                actionBar.title = win.title||"";
	                actionBar.displayHomeAsUp = !noback;
	                actionBar.onHomeIconItemSelected = function() {
	                    if (!win.no_back)
	                    	win.close();
	                };

	            }
	        }
	}
	if (win.activity && win.activity.actionBar)
		open_();
	else
		win.addEventListener("open", open_);

	return;
}

//显示正在加载
function show_loading(tip) {
	Ti.App.fireEvent('show_indicator', {tip : tip});
}

//关闭正在加载
function hide_loading() {
	Ti.App.fireEvent('hide_indicator');
}

//显示提示信息
function show_notice(text) {
	Ti.App.fireEvent('show_notice', {
		notice: text
	});
}

function show_alert(title, message) {
	Titanium.UI.createAlertDialog({
		message : message,
		title : title,
		buttonNames : ["确定"]
	}).show();
}

//对按钮进行预处理
function pre_btn(button){
	button.color = "white";
	button.borderRadius = __l(4);
	button.backgroundImage = "/images/bg.png";
	button.backgroundSelectedImage = "/images/bg_select.png";
}

function group_tableview(tableview){
	if (Ti.App.is_android){
		//tableview.borderRadius = 6;
		//tableview.left = 10;
		//tableview.right = 10;
		tableview.separatorColor = "#ccc";
		//if (!tableview.top || tableview.top == 0)
		//	tableview.top = 10;
		tableview.borderWidth = 1;
		tableview.borderColor = "#ccc";
		if (!tableview.top)
			tableview.top = 0;

		if (!tableview.height)
			tableview.height = Ti.UI.SIZE;
	}
}

function open_web_window(url, title, args){
	var win = Titanium.UI.createWindow({
		title : title || "",
		backgroundColor : '#fff',
		backButtonTitle: ''
	});

	var NappJockey = require('dk.napp.jockey');
	var webview = NappJockey.createWebView({
		    url: url,
		    borderWidth: 0
	});
	if (Ti.App.is_android){
		webview.borderColor = "white";
	}
	win.add(webview);

	webview.addEventListener('load', function(e) {
		Ti.App.fireEvent("page_load", {
			url : url
		});
	});
	if (args && args.button){
		var right = Ti.UI.createButton({
			title: args.button
		});
		right.addEventListener("click", function(e){
			args.callback(win);
		});
		if (!Ti.App.is_android) {
			win.setRightNavButton(right);
		} else {
			add_default_action_bar2(win, win.title, args.button, function(e){
				right.fireEvent("click");
			});
		}
	}
	else{
		var right = Ti.UI.createButton({
			//systemButton: Ti.UI.iPhone.SystemButton.REFRESH
			backgroundImage: "/images/ic_menu_share.png",
			width: 30,
			height: 30
		});
		right.addEventListener("click", function(e){
			var sharesdk = require("com.mamashai.sharesdk");
			sharesdk.share({
	            title: title,
	            type: "news",
	            content: (title||"分享一个网页") + url,
	            url: url
	    	});
		});
		if (!Ti.App.is_android) {
			win.setRightNavButton(right);
		} else {
			add_default_action_bar2(win, win.title, Ti.Android.R.drawable.ic_menu_share, function(e){
				right.fireEvent("click");
			});
		}
	}

	if (Ti.App.is_android){
		win.open();
	}
	else{
		Ti.App.currentTabGroup.activeTab.open(win, {
			animated : true
		});
	}

	return win;
}

function input_text(title, value, callback){
	var win = Titanium.UI.createWindow({
		title : title,
		backgroundColor : '#fff',
		backButtonTitle: ''
	});

	var edit = Ti.UI.createTextField({
		top: __l(20),
		left: __l(20),
		right: __l(20),
		height: __l(40),
		hintText: title,
		value: value,
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
	});
	win.addEventListener("open", function(e){
		edit.focus();
	});
	win.add(edit);

	var right = Ti.UI.createButton({
		title: "确定"
	})
	right.addEventListener("click", function(e){
		callback(edit.value);
		win.close();
	})

	if (Ti.App.is_android){
		add_default_action_bar2(win, title, "确定", function(e){
			right.fireEvent("click");
		})
	}
	else{
		win.setRightNavButton(right)
	}

	if (Ti.App.is_android){
		win.open();
	}
	else{
		Ti.App.currentTabGroup.activeTab.open(win, {
			animated : true
		});
	}
}

function next_order(field1, field2){
	field1.returnKeyType = Titanium.UI.RETURNKEY_NEXT;
	field1.addEventListener("return", function(e){
		field2.focus();
	});
}

function confirm_dialog(title, callback){
		var dialog = Titanium.UI.createAlertDialog({
			title : '提示',
			message : title,
			buttonNames : ['取消', '是的']
		});
		dialog.addEventListener("click", function(e1) {
			if(e1.index == 1) {//重试
				callback();
			}
		});
		dialog.show();
}

function make_datepick_field(win, field, minyear){
	function birthday_click(){
		field.blur();
		if (Ti.App.is_android){
			Ti.UI.Android.hideSoftKeyboard();
			setTimeout(function(){
				Ti.UI.Android.hideSoftKeyboard();
			}, 400)	;
		}

		var now = new Date();

		var minDate = new Date();
		if (typeof(minyear) == "number"){
			minDate.setFullYear(minyear||1940);
			minDate.setMonth(0);
			minDate.setDate(1);
		}
		else{
			minDate = minyear;
		}


		var maxDate = new Date();
		maxDate.setFullYear(now.getFullYear() + 1);
		maxDate.setMonth(12);
		maxDate.setDate(31);

		var value = new Date();
		if (field.value){
			var ts = field.value.split('-');
			value.setFullYear(ts[0]);
			value.setMonth(ts[1]-1);
			value.setDate(ts[2]);
		}

		var date_picker = Ti.UI.createPicker({
			type:Ti.UI.PICKER_TYPE_DATE,
			minDate:minDate,
			maxDate:maxDate,
			value: value,
			visibleItems: 3,
			width: Ti.App.platform_width,
			//useSpinner : true,
			locale : 'zh-CN'
		});

		if (Ti.App.is_android){
			date_picker.showDatePickerDialog({
				value: date_picker.value,
				callback: function(e){
					if (!e.cancel){
						field.value = e.value.getFullYear() + "-" + (e.value.getMonth()+1) + "-" + e.value.getDate();
						field._value = e.value;
						date_picker.value = e.value;
					}
				},
				okButtonTitle: '确定',
				title: '请选择日期'
			});
		}
		else{
			var PickerView = require('/lib/picker_view');
			var picker_view = PickerView.create_picker_view(date_picker, function(){
				field.value = date_picker.value.getFullYear() + "-" + (date_picker.value.getMonth()+1) + "-" + date_picker.value.getDate();
				field._value = date_picker.value;
			});
			win.add(picker_view);
			picker_view.animate(PickerView.picker_slide_in);
		}
	}
	field.addEventListener("click", birthday_click);
	field.addEventListener("focus", birthday_click);
}

function new_child_row(title, callback){
		var row = Ti.UI.createTableViewRow({
			height: Ti.UI.SIZE,
			selectionStyle: "NONE",
			hasChild: true
		});

		row.add(Ti.UI.createLabel({
			left: __l(12),
			top: __l(12),
			bottom: __l(12),
			height: Ti.UI.SIZE,
			font: {fontSize: __l(16)},
			color: '#333',
			text: title
		}));

		row.addEventListener("click", callback);

		return row;
}


/*
 * 创建tab按钮组
 * var tab = create_tab_button(["b1", "b2", "b3"], {
		labels: ["b1", "b2", "b3"],
		backgroundColor:'#336699',
		//backgroundColor:'white',
	    bottom: __l(50),
	    style:Titanium.UI.iPhone.SystemButtonStyle.BAR,
	    buttonBackgroundColor: "#336699",
	    height: __l(25),
	    width: __l(200)
	})
	tab.addEventListener("click", function(e){
		if (!e.index && e.index != 0)
			return;

		alert(e.index)
	})
 *
 */
function create_tab_button(labels, attr){
	var view;
	if (true || Ti.App.is_android){
		var view = Ti.UI.createView(attr);
		view.borderRadius = __l(4);
		view.borderWidth  = 1;

		var buttons = [];
		view.borderColor  = attr.backgroundColor || "black";
		view.layout = "horizontal";
		for(var i=0; i<labels.length; i++){
			var button = Ti.UI.createView({
				backgroundColor: attr.index == i ? attr.backgroundColor : "white",
				height: Ti.UI.FILL,
				touchEnabled: true,
				width: 100/(labels.length) + "%",
				index: i
			});
			var label = Ti.UI.createLabel({
				text: labels[i],
				color: attr.index == i ? "white" : attr.backgroundColor,
				font: {fontSize: attr.fontSize ? attr.fontSize : attr.height*0.6},
				textAlign: "center",
				width: Ti.UI.FILL,
				touchEnabled: false
			});
			button._label = label;
			button.add(label);

			button.addEventListener("click", function(e){
				for(var j=0; j<buttons.length; j++){
					buttons[j].backgroundColor = "white";
					buttons[j]._label.color = attr.backgroundColor;
				}
				e.source.backgroundColor = attr.backgroundColor || "black";
				e.source._label.color = "white";
				view.index = e.source.index;
				view.fireEvent("click", {index: e.source.index});
			});
			if (i == labels.length - 1)
				button.width = Ti.UI.FILL;
			view.add(button);
			buttons.push(button);

			var line = Ti.UI.createView({
				backgroundColor: attr.backgroundColor || "black",
				width: 1,
				height: Ti.UI.FILL
			});
			if (i < labels.length-1)
				view.add(line);
		}
	}
	else{
		view = Titanium.UI.iOS.createTabbedBar(attr);
		view.labels = labels;
		view.style = Titanium.UI.iPhone.SystemButtonStyle.BAR;
	}

	return view;
}

function add_android_scroll_ind(scroller, width){
	if (!Ti.App.is_android)
		return;

	scroller.showPagingControl = false;

	if (scroller.views.length == 1)
		return;

	if (scroller.ind_wrapper){
		scroller.remove(scroller.ind_wrapper);
	}

	var wrapper = Ti.UI.createView({
		bottom: __l(0),
		left: 0,
		right: 0,
		width: width,
		height: __l(20)
	});
	scroller.add(wrapper);

	var inds = [];
	for(var i=0; i<scroller.views.length; i++){
		var w = Ti.UI.createView({
			height: __l(8),
			width: __l(8),
			borderRadius: __l(4),
			backgroundColor: Ti.App.bar_color,
			opacity: 0.4,
			bottom: __l(8),
			left: __l(20)*i + Ti.App.platform_width/2 - __l(20)*scroller.views.length/2 + __l(10)
		});
		wrapper.add(w);
		inds.push(w);
	}
	inds[scroller.currentPage].opacity = 0.9;
	scroller.inds = inds;
	scroller.addEventListener("scrollend", function(e){
		for(var i=0; i<e.source.inds.length; i++){
			e.source.inds[i].opacity = 0.2;
		}
		e.source.inds[e.currentPage].opacity = 0.9;
	});
	scroller.ind_wrapper = wrapper;
}

function galary_browse(arr, index){
	var w = Titanium.UI.createWindow({
		backgroundColor : '#fff',
		navBarHidden: Ti.App.is_android ? true : false,
		title: "图片预览",
		//theme: "NoActionBar",
		backgroundColor: "white"
	});
	var pic_arr = [];
	var scrollView = Titanium.UI.createScrollableView({
		showPagingControl : arr.length > 1 ? true: false,
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: 'white',
		pagingControlColor : "transparent",
		pics: []
	});
	for(var i=0; i<arr.length; i++){
		var wrapper = null;
		if (Ti.App.is_android) {
			wrapper = Titanium.UI.createView({
				top : 0,
				left : 0,
				right : 0,
				bottom : 0,
				backgroundColor : 'white'
			});
		} else {
			wrapper = Titanium.UI.createScrollView({
				//contentWidth : 'auto',
				contentWidth: Ti.App.platform_width,
				contentHeight : 'auto',
				top : 0,
				bottom : 0,
				left : 0,
				right : 0,
				zIndex : 1,

				backgroundColor : 'white',

				showVerticalScrollIndicator : false,
				showHorizontalScrollIndicator : false,
				maxZoomScale : 4,
				minZoomScale : 1
			});
			wrapper.addEventListener("click", function(e){
				w.close();
			});
		}
		var pic = Ti.UI.createImageView({
			image : arr[i],
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			wrapper: wrapper
		});

		scrollView.pics.push(pic);
		if (Ti.App.is_android){
			pic.width = Ti.App.platform_width;
			if (arr.length == 1 && i== 0){
				pic.addEventListener("load", function(e){
					var PhotoMod = require('tjatse.photo');
					var PhotoView = PhotoMod.createPhotoView({
						scaleType: 'CENTER',
						imageView: e.source,
						maxZoomValue: 5,
						minZoomValue: 1,
					});
					PhotoView.pinchable();
				});
			}
		}

		pic.addEventListener("click", function(e){
			w.close();
		});

		var actInd = Titanium.UI.createActivityIndicator({
			top : Ti.App.platform_height / 2 - __l(15),
			height : __l(30),
			width : __l(30)
		});

		if (Ti.App.is_android){
			 actInd.style = Titanium.UI.ActivityIndicatorStyle.BIG_DARK;
		}

		wrapper.add(actInd);
		pic.actInd = actInd;
		actInd.show();

		pic.opacity = 0;
		pic.addEventListener("load", function(e){
			e.source.opacity = 0;
			e.source.animate({opacity: 1, duration: 800});
			e.source.actInd.hide();
		});

		wrapper.add(pic);
		scrollView.addView(wrapper);
	}

	scrollView.scrollToView(index);
	add_android_scroll_ind(scrollView, Ti.App.platform_width);
	w.add(scrollView);
	add_default_action_bar(w, w.title);
	w.fullscreen = true;
	w.open();

	logEvent('show_picture');
}

//打开摄像头拍照，强行剪裁为960*640或640*960
function show_camera(allow_edit, callback, cancel_callback){
	Titanium.Media.showCamera({
				cancel: function(){
					if (cancel_callback)
						cancel_callback();
				},
				success:function(event)
				{
					var cropRect = event.cropRect;
					var image = event.media;

					if (image.length == 0){
						show_alert("发生了错误", "无法识别图片格式")
						if (cancel_callback)
							cancel_callback();

						return;
					}

					if (Ti.App.is_android){			//iphone交给第三方库处理
						if (allow_edit){			//抽取出中间的方图
							var imagefactory = require('ti.imagefactory');
							var size = image.width;
							if (image.height < image.width)
								size = image.height;
							image = imagefactory.imageAsThumbnail(image, {size: size})
							image = imagefactory.imageAsResized(image, { width:600, height:600 });
							callback(image, null)
						}
						else{
							var file_o = Ti.Filesystem.getFile(image.nativePath);
							var timer = new Date().getTime();
							var file_path = Ti.Filesystem.applicationDataDirectory + timer + ".png";
							var result = file_o.copy(file_path);
							if (!result){
								show_alert("提示", "打开图片失败");
								return;
							}
							var imagefactory = require('fh.imagefactory');
							image = imagefactory.rotateResizeImage(file_path, 800, 60);
							file = Ti.Filesystem.getFile(file_path);
							var blob = file.read();
							callback(blob, null, blob.width, blob.height);
							return;
						}
					}
					else{							//iphone不处理
						var ImageFactory = require('ti.imagefactory');
						image = ImageFactory.compress(image, 0.5);
						callback(image, null);
					}
				},
				allowEditing: allow_edit,
				saveToPhotoGallery:true,
				mediaTypes:[Ti.Media.MEDIA_TYPE_PHOTO]
			});
}

function select_photo(allow_edit, callback, cancel_callback){
	Titanium.Media.openPhotoGallery({
				cancel: function(){
					if (cancel_callback)
						cancel_callback();
				},
				success: function(event) {
					var cropRect = event.cropRect;
					var image = event.media;

					if (image.length == 0){
						show_alert("发生了错误", "无法识别图片格式")
						if (cancel_callback)
							cancel_callback();

						return;
					}

					if (Ti.App.is_android){			//iphone交给第三方库处理
						if (allow_edit){			//抽取出中间的方图
							var file_o = Ti.Filesystem.getFile(image.nativePath);
							var timer = new Date().getTime();
							var file_path = Ti.Filesystem.applicationDataDirectory + timer + ".png";
							var result = file_o.copy(file_path);
							if (!result){
								show_alert("提示", "打开图片失败");
								return;
							}
							var imagefactory = require('fh.imagefactory');
							image = imagefactory.rotateResizeImage(file_path, 800, 60);
							file = Ti.Filesystem.getFile(file_path);
							var image = file.read();


							var imagefactory = require('ti.imagefactory');
							var size = image.width;
							if (image.height < image.width)
								size = image.height;
							image = imagefactory.imageAsThumbnail(image, {size: size})
							image = imagefactory.imageAsResized(image, { width:600, height:600 });

							callback(image, null)
						}
						else{
							var file_o = Ti.Filesystem.getFile(image.nativePath);
							var timer = new Date().getTime();
							var file_path = Ti.Filesystem.applicationDataDirectory + timer + ".png";
							var result = file_o.copy(file_path);
							if (!result){
								show_alert("提示", "打开图片失败");
								return;
							}
							var imagefactory = require('fh.imagefactory');
							image = imagefactory.rotateResizeImage(file_path, 1024, 100);
							file = Ti.Filesystem.getFile(file_path);
							var blob = file.read();
							var ImageFactory = require('ti.imagefactory');
							blob = ImageFactory.compress(blob, 0.8);
							callback(blob, null, blob.width, blob.height);
							return;
						}
					}
					else{							//ios平台
						//callback(image, null)
						var ImageFactory = require('ti.imagefactory');
						if (allow_edit){			//抽取出中间的方图
							var size = image.width;
							if (image.height < image.width)
								size = image.height;

							image = ImageFactory.imageAsThumbnail(image, {size: size});
							image = ImageFactory.imageAsResized(image, { width:600, height:600 });
							image = ImageFactory.compress(image, 0.6);
							callback(image, null);
						}
						else{
							var len = 1024;
							if (image.height >= image.width && image.width > len){
								var new_width = len;
								var new_height = len*image.height/image.width;
								image = ImageFactory.imageAsResized(image, {width: new_width, height: new_height});
							}
							else if (image.width > image.height && image.height > len){
								var new_height = len;
								var new_width = len*image.width/image.height;
								image = ImageFactory.imageAsResized(image, {width: new_width, height: new_height});
							}

							image = ImageFactory.compress(image, 0.5);

							callback(image, null);
						}
					}
				},
				error: function(e) {
					show_alert(title, e);
				},
				allowEditing: allow_edit
			});
}

//弹出选择照片或拍摄照片的option dialog，callback传入image,path两个参数
function select_image(allow_edit, callback, cancel_callback){
	var manu = Titanium.Platform.manufacturer.toLowerCase();
	if (manu.indexOf('samsung') != -1){		//三星有些机型拍照就崩溃
		select_photo(allow_edit, callback, cancel_callback);
		return;
	}

	//非三星
	var optionsDialogOpts = {
		options:['拍摄照片', '选择图片', '取消'],
		cancel:2
	};

	var dialog = Titanium.UI.createOptionDialog(optionsDialogOpts);
	dialog.addEventListener('click',function(e)
	{
		if (e.index == 0){		//拍摄照片
			show_camera(allow_edit, callback, cancel_callback)
		}
		else if (e.index == 1){
			select_photo(allow_edit, callback, cancel_callback)
		}
		else if (e.index == 2){
			if (cancel_callback){
				cancel_callback();
			}
		}
	})
	dialog.show();
}

function add_touch_effect(view){
	view.addEventListener("touchstart", function(e){
		e.source.o_backgroundColor = e.source.backgroundColor;
		e.source.backgroundColor = Ti.App.bg_color;
	});
	view.addEventListener("touchcancel", function(e){
		e.source.backgroundColor = e.source.o_backgroundColor;
	});
	view.addEventListener("touchend", function(e){
		e.source.backgroundColor = e.source.o_backgroundColor;
	});
}

function create_picker_field(win, items, options){
		var picker = Titanium.UI.createPicker(options);
		var data = []
		for(var i=0; i<items.length; i++){
			data[i] = Ti.UI.createPickerRow({title: items[i], custom_item: items[i]});
		}
		picker.add(data);
		picker.addEventListener('change',function(e)
		{
			picker.title_value = e.row.title;
			picker.custom_value = e.row.custom_item;
		});

		if (Ti.App.is_android){
			return picker;
		}

		var field_picker = Ti.UI.createTextField(options);
		field_picker.editable = false
		picker.left = 0

		function picker_click(){
			field_picker.blur();

			var PickerView = require('/lib/picker_view');
			var picker_view = PickerView.create_picker_view(picker, function(){
				field_picker.value = picker.title_value;
				field_picker.custom_value = picker.custom_value;
			});
			win.add(picker_view);
			picker_view.animate(PickerView.picker_slide_in);

			for(var i=0; i<data.length; i++){
				if (data[i].title == field_picker.value){
					picker.setSelectedRow(0, i, true);
					break;
				}
			}
		}
		field_picker.addEventListener("click", picker_click)

		return field_picker;
}

function create_spin_number(value, min, max, step, options){
		var wrapper = Ti.UI.createView(options)
		wrapper.borderColor = "#9C9C9C"

		var left = Ti.UI.createView({
			backgroundColor: "#EFEFEF",
			width: options.height,
			left: 0
		})
		left.addEventListener("click", function(e){
			if (parseInt(txt.text) <= min)
				return;

			txt.text = parseInt(txt.text) - step;
			right.touchEnabled = true;

			wrapper.value = txt.text;
			if (txt.text == min){
				left.touchEnabled = false;
			}
		});
		add_touch_effect(left)

		left.add(Ti.UI.createImageView({
			image: "/images/minus.png",
			left: __l(4),
			right: __l(4),
			top: __l(4),
			bottom: __l(4),
			width: options.height - __l(8),
			height: options.height - __l(8),
			touchEnabled: false,
			backgroundColor: "transparent"
		}))
		wrapper.add(left)
		wrapper.add(Ti.UI.createView({
			top: 0,
			bottom: 0,
			width: 1,
			backgroundColor: "#9C9C9C",
			left: options.height
		}))

		var txt = Ti.UI.createLabel({
			height: options.height,
			left: options.height,
			right: options.height,
			bottom: __l(0),
			borderWidth: 0,
			textAlign: "center",
			color: Ti.App.font_color,
			font: {fontSize: options.font.fontSize},
			editable: false,
			text: value
		});
		txt.addEventListener("change", function(e){
			wrapper.value = txt.value;
		});
		wrapper.add(txt);

		var right = Ti.UI.createView({
			backgroundColor: "#EFEFEF",
			width: options.height,
			right: 0,
		})
		right.addEventListener("click", function(e){
			if (parseInt(txt.text) >= max)
				return;

			txt.text = parseInt(txt.text) + step;
			left.touchEnabled = true;

			wrapper.value = txt.text;
			if (txt.text == max){
				right.touchEnabled = false;
			}
		});
		add_touch_effect(right);
		right.add(Ti.UI.createImageView({
			image: "/images/add.png",
			left: __l(4),
			right: __l(4),
			top: __l(4),
			bottom: __l(4),
			width: options.height - __l(8),
			height: options.height - __l(8),
			touchEnabled: false,
			backgroundColor: "transparent"
		}))
		wrapper.add(right)
		wrapper.add(Ti.UI.createView({
			top: 0,
			bottom: 0,
			width: 1,
			backgroundColor: "#9C9C9C",
			right: options.height
		}))
		return wrapper;
}

function get_mentions(){
	if (check_login()){
		http_call({
			url: Ti.App.host_url + "/api/user/unread_messages?" + account_str(),
			success: function(e){
				var json = JSON.parse(e.responseText);
				if (json.unread_message_count == 0){
					require('lib/db').db.delete_one_json("mention", 0);
					Ti.App.fireEvent("get_mention", {number: 0});
					return;
				};

				require('lib/db').db.insert_json("mention", 0, e.responseText);
				Ti.App.fireEvent("get_mention", {number: json.unread_message_count});
			}
		});
	}
	else{
		require('/lib/db').db.delete_one_json("mention", 0);
		Ti.App.fireEvent("get_mention", {number: 0});
	}
}
