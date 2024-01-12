
官方文档
https://docs.sublimetext.io/reference/commands.html#commands
插件开发
http://www.voidme.com/sublimetext3/sublimetext3-api#sublime.Window
借鉴意义插件示例：
https://github.com/dzhibas/SublimePrettyJson
https://github.com/randy3k/Terminus
https://github.com/Wramberg/TerminalView

插件开发
重启会导致开发的插件被删除，需要修改文件： Packages/Users/Package Control.sublime-settings，添加自己的插件，如下
```json
{
	"bootstrapped": true,
	"in_process_packages":
	[
	],
	"installed_packages":
	[
		"bad_tool",
		"Compare Side-By-Side",
		"Indent XML",
		"Keymaps",
		"MarkdownEditing",
		"Package Control",
		"Pretty JSON",
		"Pretty YAML",
		"Text Marker"
	]
}

```

安装的插件
pretty json
	shift + alt + m 		格式化json
	shift + ctrl + alt + m 	压缩json
text marker
	option + 点击 			标记
	在已标记的位置option+点击 	取消标记
compare
package control

shift + alt + p  	包管理
F5 排序key
alt+m 行标记
设置ctrl+点击，没有文件就创建一个
	Preferences->Browse Packages->Users Default (OSX).sublime-mousemap
	[
	  { "button": "button1", "modifiers": ["alt"], "command": "text_marker", "press_command": "drag_select" },
	  { "button": "button1", "count": 2, "modifiers": ["alt"], "command": "text_marker_clear", "press_command": "drag_select" }
	]
设置快捷键
```
[
	{ "keys": [ "ctrl+1" ],"command": "text_marker"},
	{ "keys": [ "super+shift+m" ],"command": "pretty_json"},
	{ "keys": [ "super+ctrl+shift+m" ],"command": "un_pretty_json"},
	{ "keys": ["ctrl+d"], "command": "run_macro_file", "args": {"file": "res://Packages/Default/Delete Line.sublime-macro"} },
	
	{ "keys": ["super+shift+u"], "command": "swap_case" },

	{ "keys": ["super+m"], "command": "toggle_bookmark" },
]
```





Ctrl + shift + 上/下  多行光标
Ctrl + command + G   当前选中的文本，全部选中
	

	args": {"file": "res://Packages/Default/Delete Line.sublime-macro"} },
	{ "keys": ["super+shift+u"], "command": "upper_case" },
	{ "keys": ["super+u"], "command": "lower_case" },
	{ "keys": ["super+m"], "command": "toggle_bookmark" },
转换前缀：
`\U` --- 转换所有字符为大写
`\L` --- 转换所有字符为小写
`\u` --- 首字大写
 `\l` --- 首字小写
`\E` --- 大小写转换结束表示，有多个正则转换变量时需要需要



```
小写转大写
- order_id  ->  orderId
  find:    _([a-z])
  replace: \U$1

首字母小写转大写
orderId -> OrderId
  find    (^\w)
  replace \U$1     \U是字符转大写，所以需要匹配到的字符用()抱起来

```

以“河南”开头

```
/^河南.*/
```

以“（河南）”开头

```
/^[\(\（]河南[\)\）].*/
```

不以“河南”开头

```
/^(?!河南).*/
```

不以“（河南）”开头

```
/^(?![\(\（]河南[\)\）]).*/
```

以_local结尾的单词

```
\w+(?<!_local)
```

