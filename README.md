# 明星框架

在[移动开发之殇](chapters_of_preface/mobile_development_disadvantages.md)中我详
细的描述了当前移动开发的痛点:

- 不敏捷
- 更新迭代慢
- 开发效率低

明星框架很好的解决了这些问题。这个框架由 刘明星 建立的，并且在2015年8月的一次
北京 Titanium 社区技术分享上公开给大家。 所以我叫它明星框架。

明星框架的核心理论是：把传统写在客户端的代码写在服务器上。在使用Titanium之前，
明星也在其他语言上有过类似的成功经验。

明星框架完全解决了移动开发不敏捷的问题。可以极大的提高开发效率。它的地址是：

https://github.com/star-framework/star-framework


# 把原本写在app上的代码，放到服务器端

把app的代码写到服务器端，然后在app端访问远程界面。 把代码缓存到本地。
使用  eval () 来调用。

这个框架能够实现，在技术上有几种依托：

1. 代码不需要编译。

2. 支持eval 这样的方法

好处是：

1. 不需要编译的等待时间。 这边写了那边立马看到

2. 可以随时随地修改app上的代码。

## 前景：

这个框架绝对是一种变革.

我们把Titanium 看成是 nginx,  则android 就是linux.
我们在linux上写html是不需要编译的， 同理，我写mobile app，
骨架部分需要编译， 肌肉部分是不需要的。

## 过程：

假设你的代码，在titanium上是静态代码:

app.js:
```js
window = Ti.UI.createWindow({
    title: '本地的工地'
})
label = Ti.UI.createLabel({
    text: '这里的内容是本地的，将来要放到远程上'
})
window.add(label)
window.open()
```
那么，我们要做的是：

1. 先把这个window 在app.js中 抽取出来，成为一个 js module:

app目录下的 `/Resources/lib/foo.js`:

```js
Foo = function(){
    window = Ti.UI.createWindow({
        title: '某个窗口'
    })
    label = Ti.UI.createLabel({
        text: '这里的内容是本地的，将来要放到远程上'
    })
    window.add(label)
    return window;
}

module.exports = Foo;
```

2. 在 `Resources/app.js` 中，使用 require 来调用这个module:

```js
wrapper = require('lib/foo.js');
wrapper.open();
```

运行，没问题~

3. 开始分解  `foo.js`， 把它的内容改成如下：

```js
function FooWindow(title) {
	var win = Ti.UI.createWindow({
		title: "某个窗体，现在要放到远程了。"
	});

	function make_foo_win(){
		http_call({url: "http://myserver.com/code/foo.js",
      cache: true,
      success: function(e){
        // 这里是关键：
        var MakeUserWin = eval(e.responseText);
        MakeUserWin(win);
      }
    });
	}

	make_foo_win();
	return win;
};

module.exports = FooWindow;
```

这个 `http_call` 的方法看起来这样：( 放到 `Resources/lib/public.js` 中）

```js
function http_call(options){
  // 如果
	if (options.cache){
		if (Ti.App.deployType == "production"){
			var record = require('/lib/db').db.select_with_check(options.url, 0);
      //没有命中
			if (record.blank){
				//啥也不干，等着后面处理
			}
      //命中了
			else{
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

	xhr.open(options.method || 'GET', url);
	if (options.args){
		xhr.send(options.args);
	}
	else{
		xhr.send();
	}
}
```

对于 `lib/db.js` 就是操作数据库的 :

```
var StarFramework;
StarFramework = StarFramework || {};
StarFramework.db = {};
StarFramework.db.insert_json = function(json_type, id, json) {
  var mili_seconds, now;
  now = new Date;
  mili_seconds = now.getTime();
  Ti.App.db.execute('delete from jsons where json_type = ? and id = ?', json_type, id + '');
  Ti.App.db.execute('INSERT INTO jsons (json_type, id, json, created_at) VALUES (?,?,?,?)', json_type, id + '', json, mili_seconds);
  Ti.API.log('insert json ' + json_type + ' ' + id);
};

StarFramework.db.insert_json_if_not_exist = function(json_type, id, json) {
  var mili_seconds, now, record;
  now = new Date;
  record = Ti.App.db.execute('SELECT * FROM jsons where json_type=? and id=?', json_type, id + '');
  if (!record.isValidRow()) {
    mili_seconds = now.getTime();
    Ti.App.db.execute('INSERT INTO jsons (json_type, id, json, created_at) VALUES (?,?,?,?)', json_type, id + '', json, mili_seconds);
    Ti.API.log('insert json ' + json_type + ' ' + id);
  }
};

StarFramework.db.select_one_json = function(json_type, id) {
  var record, result;
  record = Ti.App.db.execute('SELECT * FROM jsons where json_type=? and id=?', json_type, id + '');
  Ti.API.log('select json ' + json_type + ' ' + id);
  result = null;
  if (record.isValidRow()) {
    result = {
      json: record.fieldByName('json'),
      created_at: record.fieldByName('created_at'),
      blank: false
    };
  } else {
    result = {
      blank: true
    };
  }
  record.close();
  return result;
};

StarFramework.db.select_with_check = function(json_type, id) {
  var now, record;
  record = StarFramework.db.select_one_json(json_type, id);
  now = new Date;
  if (Titanium.Network.online && !record.blank && now.getTime() - record.created_at > 1000 * 3600 * 24 * 3) {
    StarFramework.db.delete_one_json(json_type, id);
    return {
      blank: true
    };
  }
  return record;
};

StarFramework.db.delete_one_json = function(json_type, id) {
  Ti.App.db.execute('delete from jsons where json_type=? and id=?', json_type, id);
};

module.exports = StarFramework;
```

同时，你要有个远程服务器，在远程服务器的 /code/foo.js 中，要返回这个内容：

```js
FooWindow = function(window) {
  Ti.include('/lib/public.js');
  label = Ti.UI.createLabel({
    text: '这个Label被放到了远程服务器上'
  })
  window.add(label);
  return window;
};

module.exports = FooWindow;
```

现在，你要修改window的代码的话，完全不需要编译重启app,  直接在远程修改就完事儿了。


## 注意：native module要提前放到app上。

一些module ， 不但文件需要放到本地， 代码运行最好也在本地，
否则会出现 有时加载不了的情况。 深层原因疑似 网络加载有延迟。
放到本地的话就没有了。

## 注意：一些方法，要提前让app加载并运行。

这个文件，系统是不会调用的。
它存在的目的，是为了骗过编译器，(先调用一些API， createTextArea, createOptionDialog)
让编译到实体机时，系统不会出错。
要有这个文件，`Resources/function_place_holder.js`:

```js
function FunctionPlaceHolderWindow(title) {
  var t = Ti.UI.createTextArea({
    hintText: "反馈内容"
  });

  var optionsDialogOpts = {
    title: "选择您想进行的操作",
    options : ["1", "2"],
    cancel : 1
  };

  Titanium.UI.createOptionDialog(optionsDialogOpts);

  Ti.Filesystem.applicationCacheDirectory;

  Titanium.UI.iPhone.TableViewStyle.GROUPED,
  Ti.Geolocation.preferredProvider = "gps";
}

module.exports = FunctionPlaceHolderWindow;
```



# 在服务器端做控制，随时升级

想要升级，可以自动做，也可以手动做这个事儿。

原理：清除本地数据库的代码即可。

这样的话，用户再次打开app时，app 发现本地没有代码，就会向远程发起请求，
获取新的代码，并把新代码保存到本地数据库中。

```js
clean_cache = function() {
  Ti.App.db.execute("delete from jsons where json_type <> 'foo'");
};

```

## 自动做升级

在app 启动后，肯定要访问远程的接口，我们管这个接口叫 “初始化接口”，它会为
app提供各种初始化的参数。例如：

http://yourserver.com/interface/init.json:

```json
{
  app_version: '1.0.3'
}
```

当客户端获知该接口后，就会把这个 app_version 与本机保存的版本做比较，再决定
是否升级。

## 手动做升级

直接告诉你的用户，进入到“清空缓存”的页面，点击清空缓存，即可。



# 自动适配多种不同机型和屏幕

靠下面这段代码实现：

```js
function __l(x){
  if (Ti.App.is_android){
    if (Ti.App.platform_height/Ti.App.logicalDensityFactor > 800)
      return x * Ti.App.logicalDensityFactor * 1.4;
    else
      return x * Ti.App.logicalDensityFactor;
  }
  if (!Ti.App.is_android && !Ti.App.is_ipad && Ti.App.platform_width > 320){
    return parseInt(375.0*x/320);
  }
  return Ti.App.is_ipad ? 1.5*x : x;
}
```
这个代码的作用不是简单的按百分比缩放，而是在某范围内的屏幕下有个特定的尺寸，
在另一个范围内的屏幕尺寸下，再有个特定的尺寸。

使用方式：

```js
Ti.UI.createLabel({
  width: __l(50);
});
```

# 善用TableView

虽然ListView是Titanium 目前提倡的UI组件，执行效率比较高，但是也有很明显的缺点：

难以动态的修改样式

而TableView就没有这个问题。而且随着现在移动设备的性能越来越高，TableView也
用起来很好用。

在我看来，只有当某个列表超过了512行时，把TableView 换成 ListView.
