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

function create_tab_bar(tabs, no_animate) {
	var container = Ti.UI.createScrollView({
		contentWidth : 'auto',
		contentHeight : __l(44),
		showHorizontalScrollIndicator : Ti.App.is_android ? false : true,
		left : 0,
		top : 0,
		//width : Ti.App.platform_width,
		right : -1,
		height : __l(44),
		backgroundColor : '#f2f2f2',
		layout : 'horizontal',
		horizontalWrap : false,
		last_select : null
	});
	
	var w_children = [];
	for (var i = 0; i < tabs.length; i++) {
		var week = Ti.UI.createLabel({
			top : __l(2),
			bottom: __l(2),
			left : i == 0 ? __l(14) : __l(4),
			right : __l(4),
			height : __l(40),
			font : {
				fontSize : __l(15)
			},
			width: tabs[i].text.length * __l(15) + __l(6),
			textAlign : "center",
			//text : "　" + tabs[i].text + "　",
			text: tabs[i].text,
			value : tabs[i].value,
			color : "#333",
			backgroundColor : "transparent",
			index : i
		});
		
		w_children.push(week);
		
		if (i == tabs.length - 1)
			week.right = __l(8);
			
		container.add(week);
		
		if (i < tabs.length-1){
			var line = Ti.UI.createImageView({
				width: __l(1),
				top: __l(10),
				bottom: __l(10),
				left: __l(6),
				right: __l(6),
				image: "/images/person_line.png"
			});
			container.add(line);
		}
	}
	container.w_children = w_children;

	container.addEventListener("click", function(e) {
		if (e.source.text || e.index || e.index == 0) {
			var week = null;
			
			if (e.index || e.index == 0) {
				week = container.w_children[e.index];
			} else {
				week = e.source;
			}
			var to_left = false; //往左滑动
			if (container.last_select) {
				if (container.last_select.index == week.index)
					return;
			
				container.last_select.color = "#333";
				if (container.last_select.index < week.index){
					to_left = true;
				}
			}
			week.color = "#AAD";
			container.last_select = week;
			if (!no_animate){
				if (week.index >= 2){
					container.scrollTo(week.rect.x - Ti.App.platform_width/2 + week.rect.width/2, 0);
				}
				else{
					container.scrollTo(0, 0);
				}
			}	

			container.currentindex = week.index;
			
			if (!e.only_select){
				container.fireEvent("tab_click", {
					index : week.index,
					value : week.value,
					to_left: to_left
				});
			}
		}
	});
	
	if (!Ti.App.is_android){
		container.addEventListener("swipe", function(e){
			var new_index = 0;
			if (!container.last_select)
				return;
			new_index = container.last_select.index;
			if (e.direction == "left"){
				new_index += 1;
			}
			else if (e.direction == "right"){
				new_index -= 1;
			}
			if (new_index<0 || new_index >= container.children.length)
				return;
			container.children[new_index].fireEvent("click", {index: new_index});
		});
	}

	return container;
}

exports.create_tab_bar = create_tab_bar;