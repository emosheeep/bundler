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