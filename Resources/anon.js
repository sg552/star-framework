function AnonWindow(title) {
	var t = Ti.UI.createTextArea({
		hintText: "反馈内容"
	});
	
	var optionsDialogOpts = {
		title: "选择您想进行的操作",
		options : ["1", "2"],
		cancel : 1
	};

	Titanium.UI.createOptionDialog(optionsDialogOpts);
	
	Ti.UI.createWebView({
		
	});
	
	Ti.UI.createSlider({
		
	});
	
	Ti.Filesystem.applicationCacheDirectory;
	
	Ti.Geolocation.preferredProvider = "gps";
	
	Titanium.UI.Clipboard.getData("aaa");
	
	Ti.UI.create2DMatrix();
	
	Ti.UI.iPhone.ProgressBarStyle.PLAIN;
  
    Ti.UI.createProgressBar();
}

module.exports = AnonWindow;