///////////////////////创建picker view//////////////////
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
	
	return Ti.App.is_ipad ? 2*x : x;
	/*
	if (Ti.App.is_android && Ti.App.platform_width > 320 && Ti.App.platform_width <=400){
		return parseInt(1.1*x);
	}
	if (Ti.App.is_android && Ti.App.platform_width >=480){
		return parseInt(1.5*x);
	}
	return Ti.App.is_ipad ? 2*x : x;
	*/
}

var picker_height = Ti.App.is_ipad ? 451 : __l(451);
var picker_slide_in =  Titanium.UI.createAnimation({bottom:0, duration: 600});
var picker_slide_out =  Titanium.UI.createAnimation({bottom:0-__l(480), duration: 600});
//var picker_slide_out =  Titanium.UI.createAnimation({bottom:0-picker_height});
function create_picker_view(picker, callback, cancel_callback, cancel_string){
	if (Ti.App.is_android){
		if (picker.visibleItems == 5){
			picker_height = __l(168);
		}	
			
		if (picker.visibleItems == 6 || picker.visibleItems == 7){
			picker_height = __l(196);
		}
		
		if (picker.visibleItems == 8){
			picker_height = __l(364);
		}
	}
	
	var picker_view = Titanium.UI.createView({
		height: picker_height,
		bottom: 0-picker_height,
		zIndex: 100
	});
	 
	var cancel =  Titanium.UI.createButton({
		title: cancel_string || '取消',
		style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED,
		backgroundColor: "red",
		color: "white"
	});
	
	cancel.addEventListener('click',function() {
		picker_view.animate(picker_slide_out);
		if (cancel_callback)
			cancel_callback()
	});
	if (picker.no_cancel){
		cancel = Titanium.UI.createButton({
			systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
		});
	}
		
	 
	var done =  Titanium.UI.createButton({
		title: picker.ok_string || '确定',
		style:Titanium.UI.iPhone.SystemButtonStyle.DONE,
		color: "white"
	});
	
	done.addEventListener('click',function() {
		picker_view.animate(picker_slide_out, function(e){
			if (picker)
				picker_view.remove(picker);
		});
		
		if (callback)
			callback();
	});
	 
	var spacer =  Titanium.UI.createButton({
		systemButton:Titanium.UI.iPhone.SystemButton.FLEXIBLE_SPACE
	});
	
	if(!Ti.App.is_android){
		var l = null;
		var l = Ti.UI.createLabel({
			text: picker && picker.label ? picker.label : "",
			color: Ti.App.ios7 ? "#000" : '#FFF',
			font:{fontSize: 15},
			width: __l(200),
			textAlign: "center"
		});
		if (picker)
			picker.l = l;
		var toolbar =  Titanium.UI.createToolbar({
			top:200,
			items:[cancel, spacer, l, spacer, done]
		});	
		//if (!Ti.App.ios7)
		//	toolbar.barColor = Ti.App.bar_color;
			
		picker_view.label_control = l;
		picker_view.add(toolbar);
	}
	else{
		picker_view.backgroundColor = "white"
		var split = Titanium.UI.createView({
			height: __l(40),
			top: 0,
			left: 0,
			right: 0,
			backgroundColor: Ti.App.bar_color
		});
		picker_view.add(split)
		var cancel =  Titanium.UI.createButton({
				title: picker.cancel_string || ' 取消 ',
				font: {fontSize: __l(13)},
				top: __l(6),
				height: __l(28),
				left: __l(10)
		});
		cancel.addEventListener("click", function(){
				picker_view.animate(picker_slide_out);
				if (picker)
					picker_view.remove(picker)
				if (cancel_callback)
					cancel_callback()
		});
		if (!picker.no_cancel){
			split.add(cancel);
		}
		
		if (picker){
			var l = Ti.UI.createLabel({
				text: picker.label || "",
				color:'white',
				left: __l(76),
				top: __l(10),
				width: __l(300),
				font:{fontSize: __l(15), fontWeight: "bold"}
			});
			picker.l = l
			split.add(l)
		}
		var close =  Titanium.UI.createButton({
			title: picker.ok_string || ' 确定 ',
			font: {fontSize: __l(13)},
			top: __l(6),
			height: __l(28),
			right: __l(10)
		});
		close.addEventListener("click", function(){
			done.fireEvent("click");
		});
		pre_btn(cancel);
		pre_btn(close);
		picker_view.add(close);
	}
	
	picker.top = Ti.App.is_android ? __l(40) : 243;
	picker_view.add(Ti.UI.createView({
		top: Ti.App.is_android ? __l(40) : 243,
		bottom: 0,
		backgroundColor:"white"
	}));
	picker_view.add(picker);
	
	/*
	if (picker){
		picker.top = Ti.App.is_android ? __l(40) : 143;
		picker_view.add(picker);	
		picker.show();
	} 
	
	picker_view.animate(picker_slide_in);
	*/
	return picker_view;
}

exports.create_picker_view = create_picker_view;
exports.picker_slide_in = picker_slide_in;
exports.picker_slide_out = picker_slide_out;

