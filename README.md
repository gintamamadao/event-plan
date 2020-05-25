[![NPM version](https://badgen.net/npm/v/event-plan)](https://www.npmjs.com/package/event-plan)
[![NPM Weekly Downloads](https://badgen.net/npm/dw/event-plan)](https://www.npmjs.com/package/event-plan)
[![License](https://badgen.net/npm/license/event-plan)](https://www.npmjs.com/package/event-plan)

# event-plan

用于设计控制事件的触发的条件，顺序

## 实例

1. 注册触发普通的事件

```js
import EventPlan from "event-plan";

const eventPlan = new EventPlan();

// 注册事件
eventPlan.on("event_a", () => {
    console.log("event_a");
});

// 触发事件
eventPlan.emit("event_a");

// 注销事件
eventPlan.off("event_a");
```

2. 注册任务

```js
// 注册任务
eventPlan.registerTask("task_a", () => {
    console.log("task_a");
});

// 触发任务
eventPlan.startTask("task_a");

// 在任务 task_b 完成后触发任务
eventPlan.startTaskDevs("task_a", ["task_b"]);
```

与事件不一样，任务执行后会自行注销，任务必须通过 `startTask` 或者 `startTaskDevs` 触发

## API

### `eventPlan.on(name, cb);`

注册一个事件，并返回一个注销事件的句柄

```javascript
eventPlan.on("event_a", function () {
    console.log("event_a");
});
```

#### name

Type: `String`

事件名，必传参数

#### cb

Type: `Function`

触发事件时的回调函数，必传参数

### `eventPlan.emit(name[, ...args]);`

触发事件

```javascript
eventPlan.emit("event_a", arg1, arg2);
```

#### name

Type: `String`

事件名，必传参数

#### args

Type: `any`

传给回调函数的参数

### `eventPlan.off(name, cb?);`

注销事件

```javascript
eventPlan.off("event_a");
```

#### name

Type: `String`

事件名，必传参数

#### cb

Type: `Function`

如果有传，那只注销该回调函数，否则注销该事件下所有的回调函数，非必传参数

### `eventPlan.registerTask(name, cb, devs?);`

注册一个任务，与事件不一样，可以设置自动执行，而且任务执行后会自行注销，任务必须通过 `startTask` 或者 `startTaskDevs` 触发

```javascript
eventPlan.registerTask(
    "task_a",
    () => {
        console.log("task_a");
    },
    ["task_b"]
);
```

在任务 task_b 完成后触发任务 task_a

#### name

Type: `String`

事件名，必传参数

#### cb

Type: `Function`

触发事件时的回调函数，必传参数

#### devs

Type: `String[]`

在某些任务结束后自动执行，如果不传，则需要手动执行，非必传参数

### `eventPlan.startTask(name[, args]);`

触发一个任务，立即执行

```javascript
eventPlan.startTask("task_a", arg1, arg2);
```

#### name

Type: `String`

事件名，必传参数

#### args

Type: `any`

传给回调函数的参数，非必传

### `eventPlan.startTaskDevs(name[, ...args][, devs]);`

触发一个任务，自动执行，最后一个传入的参数必须是一个任务名数组，当前任务将在这些任务完成才自动完成

```javascript
eventPlan.startTaskDevs("task_a", arg1, arg2, ["task_b"]);
```

#### name

Type: `String`

事件名，必传参数

#### args

Type: `any`

传给回调函数的参数，非必传

#### devs

Type: `String[]`

在哪某些任务结束后自动执行，必传参数
