# 前言
Webpack很强大，作为前端开发人员我们必须熟练掌握。但它的原理其实并不难理解，甚至很简单。毕竟所有复杂的事物都是由简单的事物组合形成的。不光是Webpack，像Vue，React这样成熟的前端框架亦是如此。

读完本文，你会认识到：
1. Webpack打包本质还是使用fs模块读写文件，加以组合。
2. Babel真的很强大，方便我们分析源代码，提取有用的信息。
3. 如果你了解过loader，你就会知道读取源代码之后可以如何操作，而不是仅仅进行简单的字符串匹配。

另外，**希望你能跟着自己实现一遍，代码量真的不大**。

[【掘金】对比Webpack，使用Babel+Node实现一个100行的小型打包工具](https://juejin.im/post/5e7882f1e51d4526e808172e)

# 预备知识
先看一个例子，也许你还不知道，node其实还有这样一个彩蛋：

新建test.js输入一行代码：
```
/* test.js */
console.log(arguments.callee.toString())
```
在命令行中输入`node test.js`运行结果如下：
```
function (exports, require, module, __filename, __dirname) {
    console.log(arguments.callee.toString())
}
```
**注意这是控制台输出的代码，也就是console.log()的输出结果**。

由于`arguments.callee`这个属性指向函数的调用者，我们使用toString()转化后发现这居然是一个函数，由此说明，node的代码其实是运行在一个函数中的。我们写的代码最终会被这样一个函数包裹，常用的`require，module，exports，__dirname, __filename`都是这个函数的参数，所以我们才随处可用。

# 进入正题
## 代码结构

![](https://user-gold-cdn.xitu.io/2020/3/23/17106d3b4200bcb7?w=272&h=194&f=png&s=9039)

- message.js：定义了两个变量，并导出
```
export const message = 'qin'
export const weather = 'sunny day'
```

- say.js: 定义一个函数并导出
```
export default function (name) {
    console.log(`hello ${name}`)
}
```
- main.css: 样式文件
```
#app {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: breath 2s ease infinite;
}
@keyframes breath {
    from, to {
        width: 100px;
        height: 100px;
        background-color: black;
    }
    50% {
        width: 200px;
        height: 200px;
        background-color: red;
    }
}
```
- main.js：入口文件
```
import hello from './js/say.js'
import { message, weather } from './js/message.js'
import './css/main.css'

hello(message)

hello(`今天的天气是：${weather}`)
```
## 打包思路
1. 首先我们要从入口文件`main.js`开始，递归解析依并读取文件内容。可以使用`@babel/parser`来实现。
2. 获取文件内容之后做相应的处理，例如css我们需要使用一点js代码构建style节点，并插入页面中，也就是常说的`CSS in JS`这个概念。
3. 将所有资源合并成一个文件，实现打包。打包后的代码要运行在浏览器环境中，所以为了避免产生全局污染，我们需要将打包后的代码放进闭包中运行，并为其传递所运行需要的参数，所以，打包后的代码整体结构如下：
```
(function (参数) {
    /* 函数体 */
})(传参)
```
### 面临的问题
1. 浏览器不认import语法，我们需要使用babel转换为ES5
2. 我们的打包工具运行在node环境中，打包过程中势必使用CommonJs的模块规范，即使用require和module.exports来组织模块之间的引用关系。但问题是浏览器中没有require，没有module，没有exports。

聪明的你应该想到了，**开篇提到的例子**就是为了解决这个问题。

### 借鉴webpack
配置webpack进行打包，具体配置非常简单这里就不贴代码了。如果你还不会配置的话，或许需要先学习webpack的基础知识。

我删剪了部分代码，那不属于我们讨论的范畴，最后生成的bundle.js内容如下：
```
(function(modules) {
	// webpack中用来模拟node环境下的require函数
 	function __webpack_require__(path) {
        // 构造一个模块
        var module = { exports: {} };
		// 执行模块对应的函数
        modules[path].call(module.exports, module, module.exports,__webpack_require__);
        
		// 返回模块加载的的结果
        return module.exports;
 	}

 	__webpack_require__("./src/main.js");
 }) ({
    "./src/css/main.css": (function(module, exports, __webpack_require__) {
        eval("var api = __webpack_require__(/*! ../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ \"./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js\");\n            var content = __webpack_require__(/*! !../../node_modules/css-loader/dist/cjs.js!./main.css */ \"./node_modules/css-loader/dist/cjs.js!./src/css/main.css\");\n\n            content = content.__esModule ? content.default : content;\n\n            if (typeof content === 'string') {\n              content = [[module.i, content, '']];\n            }\n\nvar options = {};\n\noptions.insert = \"head\";\noptions.singleton = false;\n\nvar update = api(content, options);\n\nvar exported = content.locals ? content.locals : {};\n\n\n\nmodule.exports = exported;\n\n//# sourceURL=webpack:///./src/css/main.css?");
    }),

    "./src/js/message.js": (function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"message\", function() { return message; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"weather\", function() { return weather; });\nconst message = 'qin';\nconst weather = 'sunny day';\n\n//# sourceURL=webpack:///./src/js/message.js?");
    }),

    "./src/js/say.js": (function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = (function (name) {\n  console.log(`hello ${name}`);\n});\n\n//# sourceURL=webpack:///./src/js/say.js?");
    }),

    "./src/main.js": (function(module, __webpack_exports__, __webpack_require__) {
        "use strict";
        eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _js_say_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./js/say.js */ \"./src/js/say.js\");\n/* harmony import */ var _js_message_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./js/message.js */ \"./src/js/message.js\");\n/* harmony import */ var _css_main_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./css/main.css */ \"./src/css/main.css\");\n/* harmony import */ var _css_main_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_css_main_css__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nObject(_js_say_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(_js_message_js__WEBPACK_IMPORTED_MODULE_1__[\"message\"]);\nObject(_js_say_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"])(`今天的天气是：${_js_message_js__WEBPACK_IMPORTED_MODULE_1__[\"weather\"]}`);\n\n//# sourceURL=webpack:///./src/main.js?");
    })

});
```
可以看到，整体是一个闭包函数，传递的参数为已加载的所有的模块组成的对象。这里可以看到，**模块就是一个个的函数，即开篇提到的例子**。闭包函数的主体是，通过模拟的require函数找到对应模块并调用。至于eavl，不用多说了吧？传入代码内容字符串就会执行了。

# 开始实现
需要用到的工具如下
```
const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser') // 生成抽象语法树
const { transformFromAst } = require('@babel/core') // 转换es6语法
const { default: traverse } = require('@babel/traverse') // 抽象语法树分析

```
注意，traverse模块是ES6 Module，所以使用CommonJs引入时需要加上default

快速安装：
```
npm install @babel/parser @babel/core @babel/traverse @babel/parser -D
```

## 解析文件内容
好的，现在在根目录下新建bundler.js用来打包，我们的打包流程将写在这里。首先实现analyze函数：
```
/**
 * 通过路径读取文件并解析
 * @param {String} filePath 
 * @return {Object} 解析结果
 */
const analyze = function (filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ast = parser.parse(content, { sourceType: 'module' })
    const dependencies = [] 
    // 转换es6语法，并得到转换后的源代码
    const { code } = transformFromAst(ast, null, {
        presets: ['@babel/env']
    })
    // 分析依赖
    traverse(ast, {
        // 分析依赖的钩子
        ImportDeclaration ({ node }) {
            dependencies.push(node.source.value) // 获得所有依赖
        }
    })
    return {
        filePath,
        dependencies,
        code
    }
}
```
这里解释下traverse函数的作用。我们使用`@babel/parser`生成抽象语法树AST，就是一个描述代码结构的JSON对象，这个对象中包含了语法信息。我们可以打印下
```
console.log(ast.program.body)
```
结果是一个数组，我截取了数组中的一个元素，如下：
```
Node {
    type: 'ImportDeclaration',
    start: 0,
    end: 31,
    loc: SourceLocation { start: [Position], end: [Position] },
    specifiers: [ [Node] ],
    source: Node {
      type: 'StringLiteral',
      start: 18,
      end: 31,
      loc: [SourceLocation],
      extra: [Object],
      value: './js/say.js'
    }
}
```
可以看到`type: 'ImportDeclaration'`说明这是一个import引入语法，如此一来，我们就可以轻松的拿到对应的依赖，如上例是`./js/say.js`

traverse中的ImportDeclaration钩子，参数中包含node属性，这就是我们需要找的依赖文件，我们将它保存起来用于下面的分析。

## 递归解析依赖
通过对代码的依赖分析，获取所有资源，用于最后的打包
```
/**
 * 通过入口文件递归解析依赖，并返回所有的依赖
 * @param {String} entryFile 入口文件
 * @return 依赖的所有代码
 */
const getAssets = function (entryFile) {
    const entry = analyze(entryFile)
    const dependencies = [entry] // 起初依赖只包含入口，随着遍历不断加入
    for (const asset of dependencies) {
        // 获取目录名
        const dirname = path.dirname(asset.filePath)
        asset.dependencies.forEach(relPath => {
            // 将相对路径转换为绝对路径，相对路径是基于dirname的
            const absolutePath = path.join(dirname, relPath)
            // 处理css文件
            if (/\.css$/.test(absolutePath)) {
                const content = fs.readFileSync(absolutePath, 'utf-8')
                // 使用js插入style节点
                const cssInsertCode = `
                    const stylesheet = document.createElement('style');
                    stylesheet.innerText = ${JSON.stringify(content)};
                    document.head.appendChild(stylesheet);
                `
                dependencies.push({
                    filePath: absolutePath,
                    relPath, // 记得保存相对路径，因为require的时候需要用到
                    dependencies: [],
                    code: cssInsertCode
                })
            } else {
                const child = analyze(absolutePath)
                child.relPath = relPath // 同上
                dependencies.push(child) // 递归解析
            }            
        })
    }
    return dependencies
}
```

## 开始打包
打包的目的是将文件合并，由于浏览器环境限制，我们需要构造闭包，还要模拟node的环境变量。
```
/**
 * 打包流程主函数
 * @param {String} entry 入口文件
 * @return void
 */
const bundle = function (entry) {
    const dependencies = getAssets(entry)
    // 将依赖构建成对象
    const deps = dependencies.map(dep => {
        const filePath = dep.relPath || entry
        // 路径和模块形成映射
        return `'${filePath}':function (exports, require, module) { ${dep.code} }`
    })

    // 构造require函数，babel解析后的代码是node环境下的，我们需要构造相应的函数
    // 来模拟原生require，从我们构建的deps对象中获取相应模块函数
    const result = `(function(deps){
        function require(path){
            // 构造一个模块，表示当前模块
            const module = { exports: {} }
            // 执行对应的模块，并传入参数
            deps[path](module.exports, require, module)
            // 返回模块导出的内容，也就是require函数获取到的内容
            return module.exports
        }
        require('${entry}') // 从入口文件开始执行
    })({${deps.join(',')}})`

    // 如果你想压缩成一行可以加上这个，但是相应的要安装babel-preset-minify
    // const ast = parser.parse(result, { sourceType: 'script' })
    // const { code } = transformFromAst(ast, null, {
    //     presets: ['minify']
    // })
    
    // 写入文件
    fs.writeFileSync('./public/vendors.js', result) // 如果你压缩了，这里填code
}

// 运行打包
bundle('./src/main.js')
```

需要注意的是，**我们要将代码以为本的形式拼接在一起**，否则代码将会直接运行生成结果，这不是我们想要的。牢记，我们是在拼接代码。

`${deps.join(',')}`得到的内容是一个字符串，我们用一个大括号括起来，在运行时就相当于是一个对象了，即`{${deps.join(',')}}`。

也许你会想直接构造一个对象然后使用JSON.stringify不就好了吗。实际上不行，因为我们的这个对象的键值对中，key可以是字符串，但是value不行，value是我们模拟的一个node模块，是一个函数，JSON.stringify会导致我们最终获取到的是函数的字符串，而不是函数。

# 验收成果
打包后的vendors.js内容如下：
```
(function (deps) {
  function require(path) {
    const module = {
      exports: {}
    }
    deps[path](module.exports, require, module)
    return module.exports
  }
  require('./src/main.js')
})({
  './src/main.js': function (exports, require, module) {
    "use strict";

    var _say = _interopRequireDefault(require("./js/say.js"));

    var _message = require("./js/message.js");

    require("./css/main.css");

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        "default": obj
      };
    }

    (0, _say["default"])(_message.message);
    (0, _say["default"])("\u4ECA\u5929\u7684\u5929\u6C14\u662F\uFF1A".concat(_message.weather));
  },
  './js/say.js': function (exports, require, module) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports["default"] = _default;

    function _default(name) {
      console.log("hello ".concat(name));
    }
  },
  './js/message.js': function (exports, require, module) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.weather = exports.message = void 0;
    var message = 'qin';
    exports.message = message;
    var weather = 'sunny day';
    exports.weather = weather;
  },
  './css/main.css': function (exports, require, module) {
    const stylesheet = document.createElement('style');
    stylesheet.innerText = "#app {\r\n    position: absolute;\r\n    top: 50%;\r\n    left: 50%;\r\n    transform: translate(-50%, -50%);\r\n    animation: breath 2s ease infinite;\r\n}\r\n@keyframes breath {\r\n    from, to {\r\n        width: 100px;\r\n        height: 100px;\r\n        background-color: black;\r\n    }\r\n    50% {\r\n        width: 200px;\r\n        height: 200px;\r\n        background-color: red;\r\n    }\r\n}";
    document.head.appendChild(stylesheet);
  }
})
```
对比webpack的结果，是不是很相似？只不过我们没有使用eval函数，而是将代码直接写在函数体中。

新建html文件并引入vendors.js
```
<div id="app"></div>
<script src="./vendors.js"></script>
```
结果如下：
![动画效果](https://user-gold-cdn.xitu.io/2020/3/23/171072cc87bb2530?w=405&h=328&f=gif&s=282117)

![控制台](https://user-gold-cdn.xitu.io/2020/3/23/171072d508f511bc?w=368&h=147&f=png&s=6294)
生效了，没问题。

这就是我们自制的一个小型打包工具啦~喜欢点个赞哈😊
# 补充
在webpack打包代码结果展示那里，我删除的代码是关于webpack的一些更高级的功能的。例如webpack内置了缓存机制，一个模块加载过后就会缓存起来，并赋予id值，然后标记为已加载。以后再加载这个模块的时候通过标记判断，加载过的话就直接读缓存。

我们构建的module是这样的：
```
const module = { exports: {} }
```
而`__webpack_require__`中构建的module是这样的：
```
// installedModules就是缓存
var module = installedModules[moduleId] = {
    i: moduleId, // 通过id来获取
    l: false, // loaded：标识是否加载过
    exports: {}
};
```

# 参考
> [【掘金】实现小型打包工具](https://juejin.im/book/5bdc715fe51d454e755f75ef/section/5c10c75af265da6135726f6c)