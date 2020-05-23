'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ISymbol = _interopDefault(require('imitate-symbol'));

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var FINISH_TASK = "#_EVENT_PLAN_TASK_FINISH_#";

var EventPlan = function EventPlan(config) {
  var _this = this;

  _classCallCheck(this, EventPlan);

  this.eventsMap = {};
  this.taskStatusMap = {};
  this.taskLockMap = {};
  this.taskWaitQueue = {};
  this.globalConfig = {};

  this.on = function (taskName, handle) {
    var eventsMap = _this.eventsMap;
    var handleList = eventsMap[taskName] || [];

    if (typeof handle === "function") {
      handleList.push(handle);
    }

    eventsMap[taskName] = handleList;
    _this.eventsMap = eventsMap;
    return function () {
      _this.off(taskName, handle);
    };
  };

  this.emit = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(taskName) {
      var _len,
          arg,
          _key,
          eventsMap,
          handleList,
          res,
          _args = arguments;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              for (_len = _args.length, arg = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                arg[_key - 1] = _args[_key];
              }

              eventsMap = _this.eventsMap;
              handleList = eventsMap[taskName] || [];
              _context.next = 5;
              return Promise.all(handleList.map(function (handle) {
                return handle.apply(null, [].concat(arg, [_this.globalConfig]));
              }));

            case 5:
              res = _context.sent;

              if (!(res.length <= 1)) {
                _context.next = 10;
                break;
              }

              return _context.abrupt("return", res[0]);

            case 10:
              return _context.abrupt("return", res);

            case 11:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();

  this.off = function (taskName, handle) {
    var eventsMap = _this.eventsMap || {};
    var handleList = eventsMap[taskName] || [];

    if (typeof handle !== "function") {
      eventsMap[taskName] = [];
    } else {
      handleList = handleList.filter(function (eventFn) {
        return eventFn !== handle;
      });
      eventsMap[taskName] = handleList;
    }
  };

  this.registerTask = function (taskName, handle, devsTasks) {
    if (_this.taskLockMap[taskName]) {
      return;
    }

    var originName = taskName;
    taskName = ISymbol["for"](taskName);

    var offHandle = _this.on(taskName, handle);

    _this.taskStatusMap[taskName] = false;

    if (Array.isArray(devsTasks) && devsTasks.length > 0 && !_this.taskWaitQueue[taskName]) {
      var autoStart = function autoStart() {
        var isReady = devsTasks.every(function (name) {
          return _this.taskStatusMap[ISymbol["for"](name)];
        });

        if (isReady) {
          _this.startTask(originName);

          _this.off(ISymbol["for"](FINISH_TASK), autoStart);

          _this.taskWaitQueue[taskName] = false;
        }
      };

      _this.on(ISymbol["for"](FINISH_TASK), autoStart);

      _this.taskWaitQueue[taskName] = true;
    }

    return offHandle;
  };

  this.startTask = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(taskName) {
      var _len2,
          arg,
          _key2,
          res,
          _args2 = arguments;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              taskName = ISymbol["for"](taskName);

              if (!_this.taskLockMap[taskName]) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return");

            case 3:
              _this.taskLockMap[taskName] = true;

              for (_len2 = _args2.length, arg = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                arg[_key2 - 1] = _args2[_key2];
              }

              _context2.next = 7;
              return _this.emit.apply(_this, [taskName].concat(arg));

            case 7:
              res = _context2.sent;
              _this.taskLockMap[taskName] = false;
              _this.taskStatusMap[taskName] = true;

              _this.off(taskName);

              _this.emit(ISymbol["for"](FINISH_TASK));

              return _context2.abrupt("return", res);

            case 13:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x2) {
      return _ref2.apply(this, arguments);
    };
  }();

  this.startTaskDevs = function (taskName) {
    var _ref3;

    var devsTasks = (_ref3 = (arguments.length <= 1 ? 0 : arguments.length - 1) - 1 + 1, _ref3 < 1 || arguments.length <= _ref3 ? undefined : arguments[_ref3]);

    if (!Array.isArray(devsTasks) || devsTasks.length <= 0 || _this.taskLockMap[ISymbol["for"](taskName)]) {
      return;
    }

    var _resolve;

    var autoStart = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var isReady, res;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                isReady = devsTasks.every(function (name) {
                  return _this.taskStatusMap[ISymbol["for"](name)];
                });

                if (!isReady) {
                  _context3.next = 8;
                  break;
                }

                _context3.next = 4;
                return _this.startTask(taskName);

              case 4:
                res = _context3.sent;

                _this.off(ISymbol["for"](FINISH_TASK), autoStart);

                _this.taskWaitQueue[taskName] = false;
                _resolve && _resolve(res);

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function autoStart() {
        return _ref4.apply(this, arguments);
      };
    }();

    _this.on(ISymbol["for"](FINISH_TASK), autoStart);

    _this.taskWaitQueue[ISymbol["for"](taskName)] = true;
    return new Promise(function (resolve) {
      _resolve = function _resolve(data) {
        resolve(data);
      };
    });
  };

  this.globalConfig = config || {};
};

module.exports = EventPlan;
