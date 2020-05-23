'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ISymbol = _interopDefault(require('imitate-symbol'));

const FINISH_TASK = "EP_TASK_FINISH";

class EventPlan {
  constructor(config) {
    this.eventsMap = {};
    this.taskStatusMap = {};
    this.globalConfig = {};

    this.on = (taskName, handle) => {
      if (!taskName || typeof handle !== "function") {
        return;
      }

      const eventsMap = this.eventsMap;
      const handleList = eventsMap[taskName] || [];
      handleList.push(handle);
      eventsMap[taskName] = handleList;
      this.eventsMap = eventsMap;
      return () => {
        this.off(taskName, handle);
      };
    };

    this.emit = async (taskName, ...arg) => {
      if (!taskName) {
        return;
      }

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
      if (!taskName) {
        return;
      }

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

    this.registerTask = (taskName, handle, ...devsTasks) => {
      if (!taskName || typeof handle !== "function") {
        return;
      }

      const offHandle = this.on(taskName, handle);
      this.taskStatusMap[taskName] = false;

      if (devsTasks.length > 1) {
        const autoStart = () => {
          const isReady = devsTasks.every(name => this.taskStatusMap[name]);

          if (isReady) {
            this.startTask(taskName);
            this.off(ISymbol.for(FINISH_TASK), autoStart);
          }
        };

        this.on(ISymbol.for(FINISH_TASK), autoStart);
      }

      return offHandle;
    };

    this.startTask = async (taskName, ...arg) => {
      if (!taskName) {
        return;
      }

      const res = await this.emit(taskName, ...arg);
      this.taskStatusMap[taskName] = true;
      this.emit(ISymbol.for(FINISH_TASK));
      this.off(taskName);

      if (res.length <= 1) {
        return res[0];
      } else {
        return res;
      }
    };

    this.startTaskDevs = (taskName, ...arg) => {
      if (arg.length <= 0) {
        return;
      }

      const devsTasks = arg[arg.length - 1];

      if (devsTasks.length <= 0) {
        return;
      }

      let _resolve;

      const autoStart = async () => {
        const isReady = devsTasks.every(name => this.taskStatusMap[name]);

        if (isReady) {
          const res = await this.startTask(taskName);
          this.off(ISymbol.for(FINISH_TASK), autoStart);
          _resolve && _resolve(res);
        }
      };

      this.on(ISymbol.for(FINISH_TASK), autoStart);
      return new Promise(resolve => {
        _resolve = data => {
          resolve(data);
        };
      });
    };

    this.resetTask = taskNames => {
      if (taskNames.length <= 0) {
        return;
      }

      taskNames.forEach(name => this.taskStatusMap[name] = true);
    };

    this.globalConfig = config || {};
  }

}

module.exports = EventPlan;
