function UUBWindow(title) {
	
	var win = Ti.UI.createWindow({
		title: title,
		theme: "MyTheme1",
		exitOnClose: true,
		backgroundColor:'#F0F0F0'
	});
	
	//win.hideNavBar();
	
	var scroll_wrapper = Ti.UI.createScrollView({
		showVerticalScrollIndicator: true,
	    showHorizontalScrollIndicator: false,
	    width: Ti.UI.FILL,
	    layout: "vertical",
	    bottom: Ti.App.is_android ? __l(54) : 0,
	});
	
	var top = Ti.UI.createScrollableView({
		showPagingControl : true,
		pagingControlHeight : 30,
		pagingControlColor : "transparent",
		left: 0,
		right: 0,
		top: 0,
		width: Ti.App.platform_width,
		height: __l(320)*Ti.App.platform_width/__l(640)
	});
	
	var url = Ti.App.host_url + "/api/user/half_screen_advs?1=1";
	if (Ti.App.deployType == "development" || Ti.App.deployType == "test"){
		url += "&tp=test";
	}
	
	function fill_top(e){
			var old_views_count = 0;
			if (top.views && top.views.length > 0){
				old_views_count = top.views.length;
			}
			
			var json = JSON.parse(e.responseText);
			
			for(var i=0; i<json.length; i++){
				var ad_json = json[i];
				if (ad_json.tp == 4){		//web
					var web = Ti.UI.createWebView({
						left: 0,
						top: 0,
						right: 0,
						bottom: 0,
						width: Ti.App.platform_width,
						height: __l(320)*Ti.App.platform_width/__l(640),
						url: ad_json.url
					});
					top.addView(web);
				}
				else{
					var img = Ti.UI.createImageView({
						left: 0,
						top: 0,
						right: 0,
						bottom: 0,
						width: Ti.App.platform_width,
						height: __l(320)*Ti.App.platform_width/__l(640),
						hires : true,
						image : ad_json.logo.url + "@!mainbar",
						tp: ad_json.tp,
						url: ad_json.url,
						code: ad_json.code,
						id: ad_json.id
					});
					
					img.addEventListener("click", function(e){
							if (e.source.tp == 1){
								Ti.Platform.openURL(e.source.url)
							}
							else if (e.source.tp == 2){
								Titanium.App.fireEvent("open_url", {
									url : e.source.url
								});
							}
							else if (e.source.tp == 3 || e.source.tp == 4){
								eval(e.source.url)
							}
							logEvent('advertisement_click_' + e.source.id);
					});
							
					top.addView(img);
							
					if (ad_json.code && ad_json.code.length > 1)  	//强制执行
					{
						eval(ad_json.code);
					}
				}
				
				logEvent('advertisement_' + ad_json.id);
			}			
			
			for(var i=old_views_count-1; i>=0; i--){
				top.removeView(top.views[i]);
			}
				
			add_android_scroll_ind(top, Ti.App.platform_width);
					
			if (top.views.length > 0)
				top.currentPage = 0;
		}
		
	http_call({
		url: url,
		success: fill_top
	});
	
	setInterval(function(e) {
		http_call({
			url: url,
			success: fill_top
		});
	}, 1000*1800);
	
	//功能按钮
	var function_wrapper = Ti.UI.createView({
		top: Ti.App.platform_height < __l(500) ? 0 : __l(15),
		height: Ti.UI.SIZE,
		backgroundColor: "white",
		layout: "horizontal"
	});
	function createFunctionButton(text, image, width, callback){
		var wrapper = Ti.UI.createView({
			width: width,
			height: width*0.8,
			backgroundColor: "white"
		});
		
		wrapper.addEventListener("click", function(e){
			callback(e);
		});
		
		wrapper.addEventListener("touchstart", function(e){
			e.source.backgroundColor = "#fafafa";
		});
		wrapper.addEventListener("touchcancel", function(e){
			e.source.backgroundColor = "white";
		});
		wrapper.addEventListener("touchend", function(e){
			e.source.backgroundColor = "white";
		});
		
		wrapper.add(Ti.UI.createImageView({
			image: image,
			top: width*0.12,
			width: width*0.38,
			height: Ti.UI.SIZE,
			touchEnabled: false
		}));
		
		wrapper.add(Ti.UI.createLabel({
			font: {fontSize: __l(13)},
			color: "#474849",
			text: text,
			bottom: width*0.12,
			touchEnabled: false
		}));
		
		return wrapper;
	}
	function createButtonLine(button_height){
		return Ti.UI.createView({
			width: 1,
			left: 0,
			top: 0,
			bottom: 0,
			right: 0,
			height: button_height,
			backgroundColor: "#C1C2C3"
		});
	}
	
	var button_width = Ti.App.platform_width/3 - 1;
	var button_height = button_width * 0.8;
	function_wrapper.add(createFunctionButton("装 修", "/images/function_zx.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/decoration.js", {
			title: "我要装修",
			tp: "decoration"
		});
	}));
	
	function_wrapper.add(createButtonLine(button_height));
	
	function_wrapper.add(createFunctionButton("旅 游", "/images/function_ly.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/tourist.js", {
			title: "我要旅游",
			tp: "tourist"
		});
	}));
	
	function_wrapper.add(createButtonLine(button_height));
	
	function_wrapper.add(createFunctionButton("婚 庆", "/images/function_hq.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/wedding.js", {
			title: "我要结婚",
			tp: "wedding"
		});
	}));
	
	
	function_wrapper.add(Ti.UI.createView({
		width: Ti.App.platform_width,
		height: 1,
		left: 0,
		top: 0,
		bottom: 0,
		right: 0,
		backgroundColor: "#C1C2C3"
	}));
	
	function_wrapper.add(createFunctionButton("iPhone", "/images/function_iphone.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/iphone.js", {
			title: "我要买iPhone",
			tp: "iPhone"
		});
	}));
	
	function_wrapper.add(createButtonLine(button_height));
	
	function_wrapper.add(createFunctionButton("家用电器", "/images/function_jd.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/jd.js", {
			title: "我要买家电"
		});
	}));
	
	function_wrapper.add(createButtonLine(button_height));
	
	function_wrapper.add(createFunctionButton("奢侈品牌", "/images/function_lux.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/lux.js", {
			title: "我要买奢侈品牌",
			tp: "lux"
		});
	}));
	
	function_wrapper.add(Ti.UI.createView({
		width: Ti.App.platform_width,
		height: 1,
		left: 0,
		top: 0,
		bottom: 0,
		right: 0,
		backgroundColor: "#C1C2C3"
	}));
	
	function_wrapper.add(createFunctionButton("新车抢购", "/images/function_car.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/car.js", {
			title: "我要买车",
			tp: "car"
		});
	}));
	function_wrapper.add(createButtonLine(button_height));
	
	
	function_wrapper.add(createFunctionButton("白领租房", "/images/function_rent.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/rent.js", {
			title: "我要租房"
		});
	}));
	
	function_wrapper.add(createButtonLine(button_height));
	
	function_wrapper.add(createFunctionButton("更 多", "/images/function_more.png", Ti.App.platform_width/3 - 1, function(){
		Ti.App.util.show_window(Ti.App.code_url + "/code/iphone.js", {
			title: "更多可分期产品",
			tp: "else"
		});
	}));
	
	scroll_wrapper.add(top);
	scroll_wrapper.add(function_wrapper);
	
	win.add(scroll_wrapper);
	
	var right = Ti.UI.createButton({
		backgroundImage: "/images/ic_menu_call.png",
		width: 30,
		height: 30
	});
	right.addEventListener("click", function(e){
		Ti.Platform.openURL('tel:4008930900');
	});
	if (Ti.App.is_android){
		add_default_action_bar2(win, win.title, Ti.Android.R.drawable.ic_menu_call, function(){
			right.fireEvent("click");
		}, true);
	}
	else{
		win.setRightNavButton(right);
	}
	
	logEvent("fenqi");
	
	return win;
};

module.exports = UUBWindow;
