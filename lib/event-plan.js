'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ISymbol = _interopDefault(require('imitate-symbol'));

const FINISH_TASK = "#_EVENT_PLAN_TASK_FINISH_#";

class EventPlan {
  constructor(config) {
    this.eventsMap = {};
    this.taskStatusMap = {};
    this.taskLockMap = {};
    this.taskWaitQueue = {};
    this.globalConfig = {};

    this.on = (taskName, handle) => {
      const eventsMap = this.eventsMap;
      const handleList = eventsMap[taskName] || [];

      if (typeof handle === "function") {
        handleList.push(handle);
      }

      eventsMap[taskName] = handleList;
      this.eventsMap = eventsMap;
      return () => {
        this.off(taskName, handle);
      };
    };

    this.emit = async (taskName, ...arg) => {
      const eventsMap = this.eventsMap;
      const handleList = eventsMap[taskName] || [];
      const res = await Promise.all(handleList.map(handle => handle.apply(null, [...arg, this.globalConfig])));

      if (res.length <= 1) {
        return res[0];
      } else {
        return res;
      }
    };

    this.off = (taskName, handle) => {
      const eventsMap = this.eventsMap || {};
      let handleList = eventsMap[taskName] || [];

      if (typeof handle !== "function") {
        eventsMap[taskName] = [];
      } else {
        handleList = handleList.filter(eventFn => {
          return eventFn !== handle;
        });
        eventsMap[taskName] = handleList;
      }
    };

    this.registerTask = (taskName, handle, devsTasks) => {
      if (this.taskLockMap[taskName]) {
        return;
      }

      const originName = taskName;
      taskName = ISymbol.for(taskName);
      const offHandle = this.on(taskName, handle);
      this.taskStatusMap[taskName] = false;

      if (Array.isArray(devsTasks) && devsTasks.length > 0 && !this.taskWaitQueue[taskName]) {
        const autoStart = () => {
          const isReady = devsTasks.every(name => this.taskStatusMap[ISymbol.for(name)]);

          if (isReady) {
            this.startTask(originName);
            this.off(ISymbol.for(FINISH_TASK), autoStart);
            this.taskWaitQueue[taskName] = false;
          }
        };

        this.on(ISymbol.for(FINISH_TASK), autoStart);
        this.taskWaitQueue[taskName] = true;
      }

      return offHandle;
    };

    this.startTask = async (taskName, ...arg) => {
      taskName = ISymbol.for(taskName);

      if (this.taskLockMap[taskName]) {
        return;
      }

      this.taskLockMap[taskName] = true;
      const res = await this.emit(taskName, ...arg);
      this.taskLockMap[taskName] = false;
      this.taskStatusMap[taskName] = true;
      this.off(taskName);
      this.emit(ISymbol.for(FINISH_TASK));
      return res;
    };

    this.startTaskDevs = (taskName, ...arg) => {
      const devsTasks = arg[arg.length - 1];

      if (!Array.isArray(devsTasks) || devsTasks.length <= 0 || this.taskLockMap[ISymbol.for(taskName)]) {
        return;
      }

      let _resolve;

      const autoStart = async () => {
        const isReady = devsTasks.every(name => this.taskStatusMap[ISymbol.for(name)]);

        if (isReady) {
          const res = await this.startTask(taskName);
          this.off(ISymbol.for(FINISH_TASK), autoStart);
          this.taskWaitQueue[taskName] = false;
          _resolve && _resolve(res);
        }
      };

      this.on(ISymbol.for(FINISH_TASK), autoStart);
      this.taskWaitQueue[ISymbol.for(taskName)] = true;
      return new Promise(resolve => {
        _resolve = data => {
          resolve(data);
        };
      });
    };

    this.globalConfig = config || {};
  }

}

module.exports = EventPlan;
