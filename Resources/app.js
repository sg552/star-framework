// this sets the background color of the master UIView (when there are no windows/tab groups on it)
(function() {
	Titanium.UI.setBackgroundColor('#000');	
	Ti.App.platform_width = Titanium.Platform.displayCaps.platformWidth;
	Ti.App.platform_height = Titanium.Platform.displayCaps.platformHeight;
	
	Ti.App.dpi = Ti.Platform.displayCaps.xdpi;
	Ti.App.density = Ti.Platform.displayCaps.density;
  
  	Ti.App.is_android = Ti.Platform.osname == 'android';
	Ti.App.is_ipad = Ti.Platform.osname == 'ipad';
	Ti.App.is_iphone = Ti.Platform.osname == 'iphone';
	Ti.App.osname = Ti.Platform.osname;
	Ti.App.osversion = Titanium.Platform.version;
	Ti.App.manufacturer  = Ti.Platform.manufacturer;
	Ti.App.model  = Ti.Platform.model;
	Ti.App.bar_color = "#fa4700";
	Ti.App.bar_color2 = "#fa6720";
	Ti.App.bg_color = "#F0F0F0";
	Ti.App.font_color = "#768182";
	
	Ti.App.logicalDensityFactor = 1;
	if (Ti.App.is_android)
		Ti.App.logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
	
	Ti.App.timeout = 30000;
	
	if (Ti.App.deployType == "production" || Ti.App.deployType == "test"){
		Ti.App.host_url = "http://dev.uubpay.com";
		Ti.App.code_url = "http://dev.uubpay.com";
	}
	else{
		Ti.App.host_url = "http://192.168.56.1:3000";
		Ti.App.code_url = "http://192.168.56.1:3000";
	}
	
	//初始化数据库
	Ti.App.db = Ti.Database.open('jsonDB');
	Ti.App.db.execute('CREATE TABLE IF NOT EXISTS jsons (json_type VARCHAR(200) NOT NULL, id VARCHAR(100), json text, created_at char(50))');
	if (!Ti.App.util){
		Ti.App.util = require("/lib/util");
	}
	
	var Flurry = require("ti.flurry");
	Flurry.debugLogEnabled = true;
	Flurry.initialize(Ti.App.is_android ? "79QCVNYCVPFMRJCBB6XR" : "V3TM9MCZTBBSRKBDFJFP");
	if (Ti.App.is_android){
		Flurry.ReportLocation = false;
	}	
	
	Ti.App.addEventListener("flurry_event", function(e){
		if (Ti.App.is_android)
			return;
			
		if (e.params)
			Flurry.logEvent(e.event, e.params);
		else
			Flurry.logEvent(e.event);
	});
	
	function make_bottom_tab_window(arrs, current_index){
	  	 var window = new arrs[current_index].klass(arrs[current_index].title);
	  	 var wrapper = Ti.UI.createView({
	  	 	height: __l(54),
	  	 	left: 0,
	  	 	right: 0,
	  	 	bottom: 0,
	  	 	backgroundColor: "#999",
	  	 	layout: 'horizontal'
	  	 });
	  	 
	  	 for(var i=0; i<arrs.length; i++){
	  	 	var btn = Ti.UI.createView({
	  	 		top: 1,
	  	 		bottom: 0,
	  	 		index: i,
	  	 		width: i == arrs.length-1 ? Ti.UI.FILL : 100/arrs.length + "%",
	  	 		backgroundColor: "#eee"
	  	 	});
	  	 	btn.addEventListener("click", function(e){
	  	 		if (e.source.index > 0){
	  	 			var w = make_bottom_tab_window(arrs, e.source.index);
	  	 			w.open();
	  	 		}
	  	 		
	  	 		if (current_index > 0){
	  	 			window.close();
	  	 		}
	  	 	});
	  	 	
	  	 	btn.add(Ti.UI.createImageView({
	  	 		image: i == current_index ? arr[i].image : arr[i].image_unselect,
	  	 		top: __l(4),
	  	 		width: __l(26),
	  	 		height: __l(26),
	  	 		touchEnabled: false
	  	 	}));
	  	 	var label = Ti.UI.createLabel({
	  	 		text: arrs[i].text,
	  	 		bottom: __l(2),
	  	 		textAlign: "center",
	  	 		height: __l(18),
	  	 		font: {fontSize: __l(12)},
	  	 		touchEnabled: false,
	  	 		color: i == current_index ? Ti.App.bar_color : "#999"
	  	 	});
	  	 	btn.add(label);
	  	 	wrapper.add(btn);
	  	 }
	  	 
	  	 window.add(wrapper);
	  	 
	  	 window.addEventListener("set_badge", function(e){
	  	 	var btn = wrapper.children[e.index];
	  	 	if (btn.badge){
	  	 		if (e.number && e.number > 0){
	  	 			btn.badge.text = " " + e.number + " ";
	  	 		}
	  	 		else{
	  	 			btn.remove(btn.badge);
	  	 			btn.badge = null;
	  	 		}
	  	 	}
	  	 	else{
	  	 		if (e.number && e.number > 0){
	  	 			var badge = Ti.UI.createLabel({
			  	 		text: " " + e.number + " ",
			  	 		top: __l(2),
			  	 		right: "16%",
			  	 		width: e.number > 9 ? Ti.UI.SIZE : __l(16),
			  	 		height: __l(16),
			  	 		textAlign: "center",
			  	 		borderRadius: __l(8),
			  	 		font: {fontSize: __l(11)},
			  	 		color: "white",
			  	 		backgroundColor: "red"
			  	 	});
			  	 	btn.add(badge);
			  	 	btn.badge = badge;
	  	 		}
	  	 	}
	  	 	
	  	 	if (window.__index != 0 && Ti.App.win0){
	  	 		Ti.App.win0.fireEvent("set_badge", e);
	  	 	}
	  	 });
	  	 
	  	 var record = require('/lib/db').db.select_one_json("mention", 0);
		 if (!record.blank){
		 	var json = JSON.parse(record.json);
			var count = json.unread_message_count;
			if (count > 0){
				window.fireEvent("set_badge", {index: 2, number: count});
			}
		 }
		 
		 Ti.App.addEventListener("get_mention", function(e){
		 	if (e.number > 0){
		 		window.fireEvent("set_badge", {index: 2, number: e.number});
		 	}
		 	else{
		 		window.fireEvent("set_badge", {index: 2});
		 	}
		 });
	  	 return window;
	  }
		
	if (Ti.App.is_android){
	  var arr = [{title: "优优宝", text: "分期", image: "/images/fq-s.png", image_unselect: "/images/fq@2x.png", klass: require('fenqi')},
  			 	 {title: "福利社", text: "福利社", image: "/images/cart-s.png", image_unselect: "/images/cart@2x.png", klass: require('gou')},
  			 	 {title: "我的", text: "我的", image: "/images/user-s.png", image_unselect: "/images/user@2x.png", klass: require('user')}];
  			
  	  var win1 = make_bottom_tab_window(arr, 0);
	  
	  function exit_alert(e) {
			var alertDialog = Ti.UI.createAlertDialog({
				message : '确定要退出吗?',
				title : '提示',
				buttonNames : ['退出', '取消'],
				cancel : 1
			});
		
			alertDialog.addEventListener('click', function(f) {
				if (f.index == 0) {
					win1.close();
				}
			});
			alertDialog.show();
	  }
		
	  win1.addEventListener('androidback', exit_alert);
	  
	  if (Ti.App.Properties.getString("introduce_showed", "false") == "false"){
			var Introduce = require("/introduce");
			var introduce = new Introduce();
			introduce.open();
			Ti.App.Properties.setString("introduce_showed", "true");
			introduce.addEventListener("introduce_close", function(e){
				win1.open();
				win1.addEventListener("open", function(){
					introduce.close();
				});
			});
		}	
		else{
			win1.open();
		}
	  
	  register_notify();
	}
	else{
		//从第三方app返回的时候触发，比如从微信返回
		Ti.App.addEventListener("resumed", function(e){
			var args = Ti.App.getArguments();
			Ti.App.fireEvent("ios_resumed", {url: args.url, source: args.source});
		});

		Flurry.reportOnClose(true);
		
		var NappAppearance = require('dk.napp.appearance');
		NappAppearance.setGlobalStyling({
			pageControl:{
		        currentPageIndicatorTintColor: Ti.App.bar_color,
		        pageIndicatorTintColor:"#ececec"
		    }
		});
		var Win1 = require("fenqi");
		var Win2 = require("gou");
		var Win3 = require("user");
		
		var win1 = new Win1('优优宝');
		var win2 = new Win2('福利社');
		var win3 = new Win3('我的');	
	
		var tabGroup = Titanium.UI.createTabGroup({
			tintColor: Ti.App.bar_color,
			tabsTintColor: Ti.App.bar_color,
			navTintColor: Ti.App.bar_color,
			backgroundColor: 'white',
			barColor : "white",
			titleAttributes: {
				color: Ti.App.bar_color
			} 
		});
	  	Ti.App.currentTabGroup = tabGroup;
	
		var tab1 = Ti.UI.createTab({
			title: "免息",
			icon: '/images/fq.png',
			window: win1
		});
	
		var tab2 = Ti.UI.createTab({
			title: '福利社',
			icon: '/images/cart.png',
			window: win2
		});
		
		var tab3 = Ti.UI.createTab({
			title: '我的',
			icon: '/images/user.png',
			window: win3
		});
	
		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);
		tabGroup.addTab(tab3);
		
		if (Ti.App.Properties.getString("introduce_showed", "false") == "false"){
			var Introduce = require("/introduce");
			var introduce = new Introduce();
			introduce.open();
			Ti.App.Properties.setString("introduce_showed", "true");
			introduce.addEventListener("introduce_close", function(e){
				tabGroup.open();
				tabGroup.addEventListener("open", function(){
					introduce.close();
				});
			});
		}	
		else{
			tabGroup.open();
		}
		
		register_notify();
	}
	
	///////以下为公用代码//////
	Ti.App.addEventListener('open_url', function(e) {
		open_web_window(e.url, e.title);
	});	
	var indWin = null;
	var indWin_Show = false;
	function showIndicator(tip) {
		if (indWin && indWin.visible) {
			return;
		}
	
		indWin = Titanium.UI.createWindow({
			theme: "MyTheme3"
		});
		if (Ti.App.is_android){
			indWin.backgroundColor = "transparent";
			indWin.opacity = 0.8;
		}
		indWin.addEventListener("android:back", function(e){
			indWin.close();
			indWin = null;
			indWin_Show = false;
			is_showing = false;
		});
		
		// black view
		var indView = Titanium.UI.createView({
				height : __l(100),
				width : __l(100),
				backgroundColor : '#000',
				borderRadius : __l(10),
				opacity : 0.8
		});
		indWin.indView = indView;
		indWin.add(indView);
		
		// loading indicator
		var actInd = Titanium.UI.createActivityIndicator({
				top : __l(18),
				height : __l(30),
				width : __l(30)
		});
		if (!Ti.App.is_android) {
			actInd.style = Titanium.Platform.osname == 'ipad' ? Titanium.UI.iPhone.ActivityIndicatorStyle.BIG : Titanium.UI.iPhone.ActivityIndicatorStyle.PLAIN;
		} else {
			actInd.style = Titanium.UI.ActivityIndicatorStyle.BIG;
		}
		
		indView.add(actInd);
		
		// message
		var message = Titanium.UI.createLabel({
				text : '正在加载',
				color : '#fff',
				width : 'auto',
				height : 'auto',
				font : {
					fontSize : __l(14),
					fontWeight : 'bold'
				},
				bottom : __l(16)
		});
		if (tip && tip.length > 0) {
			message.text = tip;
		}
		indView.add(message);
		indWin_Show = true;
		actInd.show();
		
		indWin.open();
	}
	
	function hideIndicator() {
		if (indWin_Show){
			/*
			indWin.close({
				opacity : 0,
				duration : 900
			});
			*/
			indWin.remove(indWin.indView);
			indWin.close();
			indWin = null;
			indWin_Show = false;
		}
	}
	
	//
	// 显示或隐藏正在加载的浮动窗
	//
	var is_showing = false;
	Titanium.App.addEventListener('show_indicator', function(e) {
		if (is_showing) {
			if (e.tip && indWin && indWin.message) {
				indWin.message.text = e.tip;
			}
			return;
		}
		Ti.API.info("IN SHOW INDICATOR");
		showIndicator(e.tip);
		is_showing = true;
	});
	
	Titanium.App.addEventListener('hide_indicator', function(e) {
		if (Ti.version <= '3.0.0') {
			return;
		}
		
		Ti.API.info("IN HIDE INDICATOR");
		hideIndicator();
		is_showing = false;
	});
	
	//
	// 显示操作提示信息
	//
	var messageWin = Titanium.UI.createWindow({
		height : __l(30),
		width : __l(250),
		top : __l(80),
		borderRadius : __l(10),
		touchEnabled : false,
	
		orientationModes : [Titanium.UI.PORTRAIT, Titanium.UI.UPSIDE_PORTRAIT]
	});
	var messageView = Titanium.UI.createView({
		id : 'messageview',
		top : 0,
		left : 0,
		height : __l(30),
		width : __l(250),
		borderRadius : __l(10),
		backgroundColor : '#000',
		opacity : 0.7,
		touchEnabled : false
	});
	
	var messageLabel = Titanium.UI.createLabel({
		id : 'messagelabel',
		text : '',
		color : '#fff',
		width : __l(250),
		height : 'auto',
		font : {
			fontSize : __l(14)
		},
		textAlign : 'center'
	});
	messageWin.add(messageView);
	messageWin.add(messageLabel);
		
	Ti.App.addEventListener('show_notice', function(e) {
		if (Ti.App.is_android){
			var theToast = Ti.UI.createNotification({
				message: e.notice,
	    		duration: Ti.UI.NOTIFICATION_DURATION_SHORT,
	    		offsetY: 0-__l(100),
			    //gravity: 16 | 1
			    gravity: 1
			});
			theToast.show();
			
			return;
		}
		
		messageLabel.text = e.notice;
		messageWin.open();
	
		setTimeout(function() {
			messageWin.close({
				opacity : 0,
				duration : 900
			});
		}, e.last || 2000);
	});

	var android_dialog = null;
	var android_dialog_show = false;
	function show_android_notice_dialog(e){
		if (android_dialog_show)
			return;
			
		var view = Ti.UI.createView({
		    top:0,
		    width: __l(300),
		    height: __l(80),
		    backgroundColor: 'transparent'
		});
		var actInd = Titanium.UI.createActivityIndicator({
			top : __l(26),
			bottom: __l(26),
			left: __l(60),
			height : __l(30),
			width : __l(30),
			style : Titanium.UI.ActivityIndicatorStyle.BIG
		});
		var label = Ti.UI.createLabel({
		  color:'black',
		  text: e.tip || '正在加载...',
		  textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
		  top: __l(26),
		  bottom: __l(26),
		  left: __l(110),
		  font : {fontSize: __l(18)},
		  width: Ti.UI.SIZE, 
		  height: __l(30)
		});
		view.add(actInd);
		view.add(label);
		 
		android_dialog = Ti.UI.createAlertDialog({
		   //title: "提示",
		   androidView:view
		});
		android_dialog.addEventListener("android:back", function(e){
			return false;
		});
		 
		android_dialog.show();
		actInd.show();
		android_dialog_show = true;
		//dialog.show();
		return;
	}
	
	//推送中包含了自定义参数,title和json分别为推送文本内容及扩展参数
	function push_call(title, json){
		switch(json.t)
		{
		case "url":                    //传入url
		  http_call({url: json.url, 
		  			success: function(e){
		  				eval(e.responseText);
		  			}
		  		});
		  break;
		case "url2":                    //传入url
		  	Ti.App.util.show_window(json.url, {
				backButtonTitle: '',
				backgroundColor: 'white',
				title: ''
			});
		case "code":
		 	eval(json.code);
		  break;
		case "private_message":
		  get_mentions();
		  break;
		default:
			if (Ti.App.is_android)
				show_alert("提示", title);
		  break;
		}
	}
	
	function register_notify(){
		if (Ti.App.is_android){
			var push = require('com.mamashai.jpush');
			push.setAlias(Ti.App.Properties.getString("userid", ""), function(e){
				if (e.device_token.length == 0)
					return;
				
			    Ti.API.log("register to jpush code: " + e.code + ", token: " + e.device_token);
			   
			    Ti.App.Properties.setString("jpush_token", e.device_token);
	
				var url = Ti.App.host_url + "/api/user/subscribe?token=" + e.device_token;
				url += "&os=android&app=" + Ti.App.id;
				url += "&sid=" + Ti.Platform.id;
				if (check_login()){
					url += "&id=" + Ti.App.Properties.getString("userid", "");
				}
				url += "&from=jpush";
				
				Ti.API.log("subscribe push :" + e.device_token);
				var xhr = Ti.Network.createHTTPClient();
				xhr.onload = function() {
					Ti.API.log("subscribe success : " + e.device_token);
				};		
				xhr.open('GET', url, true);
				xhr.send();
			});
		}
		else{
			function subscribe(e){
				var url = Ti.App.host_url + "/api/user/subscribe?token=" + e.deviceToken;
			  	url += "&app=" + Ti.App.id;
			  	url += "&os=ios";
			  	url += "&sid=" + Ti.Platform.id;
			  	if (check_login()){
			  		url += "&id=" + Ti.App.Properties.getString("userid", "");
			  	}
			  	http_call({url: url, success: function(f){
			  		Ti.API.log("subscribe success : " + e.deviceToken);
			  	}});
			  	Ti.App.Properties.setString("ios_token", e.deviceToken);
			}
			
			if (parseInt(Ti.Platform.version.split(".")[0]) >= 8){
				function registerForPush() {
			        Ti.Network.registerForPushNotifications({
			            success: subscribe,
			            error: function(e) {
						    Ti.API.warn("push notifications disabled(ios8): "+e);
						    logEvent('push_notification_disable');
						  },
			            callback: function(e) {
						    if (e.data.t){
						    	var alert_dialog = Titanium.UI.createAlertDialog({
									title : '',
									message : e.data.alert,
									buttonNames : ['去看看', '关闭'],
									cancel : 0
								});
								alert_dialog.addEventListener("click", function(e1){
									if (e1.index == 0){
										push_call(e.data.alert, e.data);		
									}
								});
								alert_dialog.show();
						    }
						    else{
						    	show_alert("提示", e.data.alert);
						    }
						  }
			        });
			        Ti.App.iOS.removeEventListener('usernotificationsettings', registerForPush); 
			    };
			 
			    Ti.App.iOS.addEventListener('usernotificationsettings', registerForPush);
			    
				Ti.App.iOS.registerUserNotificationSettings({
				    types: [Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT, 
				    		Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND, 
				    		Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE]
				});
			}
			else{
				Ti.Network.registerForPushNotifications({
					  types: [
					    Ti.Network.NOTIFICATION_TYPE_BADGE,
					    Ti.Network.NOTIFICATION_TYPE_ALERT,
					    Ti.Network.NOTIFICATION_TYPE_SOUND
					  ],
					  success:function(e){
					  	subscribe(e);
					  },
					  error:function(e) {
					    Ti.API.warn("push notifications disabled: "+e);
					    logEvent('push_notification_disable');
					  },
					  callback:function(e) {
					    var a = Ti.UI.createAlertDialog({
					      title:'来自优优宝的提示',
					      message:e.data.alert
					    });
					    a.show();
					  }
					});
			}
		}
	}
	
	
	if (Ti.App.is_android){
		var act = Titanium.Android.currentActivity;
		var _intent = act.intent;
		var str = _intent.getStringExtra("cn.jpush.android.EXTRA");
		if (str && str.length > 0 && Ti.App.deployType != "production"){
			push_call(_intent.getStringExtra("cn.jpush.android.ALERT"), JSON.parse(str));
		}
		
		var bc = Ti.Android.createBroadcastReceiver({
		    onReceived : function(e) {
		        Ti.API.info("cn.jpush.android.PUSH_ID: " 		+ e.intent.getStringExtra("cn.jpush.android.PUSH_ID"));
		        Ti.API.info("app: " 							+ e.intent.getStringExtra("app"));
		        Ti.API.info("cn.jpush.android.ALERT: " 			+ e.intent.getStringExtra("cn.jpush.android.ALERT"));
		        Ti.API.info("cn.jpush.android.EXTRA: " 			+ e.intent.getStringExtra("cn.jpush.android.EXTRA"));
		        Ti.API.info("cn.jpush.android.NOTIFICATION_ID: "+ e.intent.getStringExtra("cn.jpush.android.NOTIFICATION_ID"));
		        Ti.API.info("cn.jpush.android.NOTIFICATION_CONTENT_TITLE: " + e.intent.getStringExtra("cn.jpush.android.NOTIFICATION_CONTENT_TITLE"));
		        Ti.API.info("cn.jpush.android.MSG_ID: " 		+ e.intent.getStringExtra("cn.jpush.android.MSG_ID"));
		        Ti.API.info("cn.jpush.android.TITLE: " 			+ e.intent.getStringExtra("cn.jpush.android.TITLE"));
		        Ti.API.info("cn.jpush.android.MESSAGE: " 		+ e.intent.getStringExtra("cn.jpush.android.MESSAGE"));
		        Ti.API.info("cn.jpush.android.CONTENT_TYPE: " 	+ e.intent.getStringExtra("cn.jpush.android.CONTENT_TYPE"));
				
				var str = e.intent.getStringExtra("cn.jpush.android.EXTRA");
				if (str && str.length > 0 && Ti.App.deployType != "production"){
					//show_alert("提示", e.intent.getStringExtra("cn.jpush.android.EXTRA"));
					push_call(e.intent.getStringExtra("cn.jpush.android.ALERT"), JSON.parse(str));
				}
		    }
		});
		 
		Ti.Android.registerBroadcastReceiver(bc, ['mamashai_jpush']);
		win1.addEventListener("close", function(){
			Ti.Android.unregisterBroadcastReceiver(bc);
		});	
		
		//收到推送，还未打开
		var bc2 = Ti.Android.createBroadcastReceiver({
		    onReceived : function(e) {
		        var json = JSON.parse(e.intent.getStringExtra("cn.jpush.android.EXTRA"));
		        if (json.t == "private_message"){
		        	get_mentions();
		        }
		    }
		});
		Ti.Android.registerBroadcastReceiver(bc2, ['mamashai_jpush_received']);
		win1.addEventListener("close", function(){
			Ti.Android.unregisterBroadcastReceiver(bc2);
		});	
	}
	
	Ti.App.addEventListener("register_notify", function(e){
		register_notify();
	});
	
	Titanium.App.addEventListener('logged_out', function(e) {
		var device_token = "";
		if (Ti.App.is_android){
			device_token = Ti.App.Properties.getString("jpush_token", "");
		}
		else{
			device_token = Ti.App.Properties.getString("ios_token", "");
		}
		var url = Ti.App.host_url + "/api/user/subscribe?token=" + device_token;
		url += "&app=" + Ti.App.id;
		if (Ti.App.is_android){
			url += "&os=android";
		}
		else{
			url += "&os=ios";
		}
		http_call({url: url, 
				success: function(f){
					Ti.API.log("unscribe");
				}
		});
	});
	
	Ti.App.addEventListener("login", function(e){
		register_notify();
	});
})();

