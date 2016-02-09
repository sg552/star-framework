function UserWindow(title) {
	var win = Ti.UI.createWindow({
		title: "我的",
		theme: "MyTheme2",
		backgroundColor:Ti.App.bg_color
	});
	
	function make_user_win(){
		http_call({url: Ti.App.code_url + "/code/user.js", 
					cache: true,
					success: function(e){
						var MakeUserWin = eval(e.responseText);
						MakeUserWin(win);
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
							make_user_win();
						});
						win.add(button);
					}
				});	
	}
	
	make_user_win();
	
	logEvent("user");
	return win;
};

module.exports = UserWindow;
