function Window(){
		var win = Titanium.UI.createWindow({
			navBarHidden: true,
			exitOnClose: false,
			theme: "Theme.AppCompat.NoTitleBar"
		});
	
		var scrollableView = Ti.UI.createScrollableView({
			showPagingControl : true,
			pagingControlHeight : 30,
			backgroundColor: "white",
			pagingControlColor : "transparent",
		});
		
		var view1 = Ti.UI.createView({
			backgroundColor: "#FEDF46",
			bottom: Ti.App.is_android ? 0 : -30
		});
		var img1 = Ti.UI.createImageView({
			image : "/images/introduce/1.jpg",
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
		});
		view1.add(img1);
		scrollableView.addView(view1);
		
		var view2 = Ti.UI.createView({
			backgroundColor: "#00ACDA",
			bottom: Ti.App.is_android ? 0 : -30
		});
		var img2 = Ti.UI.createImageView({
			image : "/images/introduce/2.jpg",
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
		});
		view2.add(img2);
		scrollableView.addView(view2);
		
		var view3 = Ti.UI.createView({
			backgroundColor: "#E86950",
			bottom: Ti.App.is_android ? 0 : -30
		});
		var img3 = Ti.UI.createImageView({
			image : "/images/introduce/3.jpg",
			height: Ti.UI.SIZE,
			width: Ti.UI.FILL,
		});
		view3.add(img3);
		scrollableView.addView(view3);
		
		var aButton = Ti.UI.createImageView({
			backgroundImage: "/images/introduce/btn.png",
			hires: true,
			height : __l(42),
			width : __l(164),
			bottom: __l(44),
		});
		
		aButton.addEventListener('click', function() {
			win.fireEvent("introduce_close");
		});
		view3.add(aButton);
		
		win.add(scrollableView);
		
		add_android_scroll_ind(scrollableView, Ti.App.platform_width);
	
	return win;
}

module.exports = Window;