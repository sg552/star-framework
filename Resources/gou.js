function GouWindow(title) {
	var win = Ti.UI.createWindow({
		title: title,
		theme: "MyTheme2",
		backgroundColor:Ti.App.bg_color
	});

	function make_gou_win(){
		http_call({url: Ti.App.code_url + "/code/gou.js",
				cache: true, 
				success: function(e){
					var MakeGouWin = eval(e.responseText);
					MakeGouWin(win);
				}, 
				error: function(){
					win.add(Ti.UI.createLabel({
						top: __l(100),
						text: "哎呀，网络连接似乎有点问题！",
						textAlign: "center",
						font: {fontSize: __l(18)},
						color: "#333"
					}));
					var button = Ti.UI.createButton({
						title: "重试",
						top: __l(150),
						width: __l(80),
						font: {fontSize: __l(18)}
					});
					button.addEventListener("click", function(e){
						make_gou_win();
					});
					win.add(button);
				}
		});
	}

	make_gou_win();
	
	add_default_action_bar2(win, win.title, "我的订单", function(e){
		if (!win.right_btn){
			show_notice("好像网络有点问题");
			return;
		}
		win.right_btn.fireEvent("click");
	}, true);
	logEvent("gou");
	return win;
};

module.exports = GouWindow;
