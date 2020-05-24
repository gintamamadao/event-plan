import ISymbol from "imitate-symbol";

const FINISH_TASK = "#_EVENT_PLAN_TASK_FINISH_#";

interface StatusMap {
    [prop: string]: boolean;
}

class EventPlan {
    private eventsMap: any = {};
    private taskStatusMap: StatusMap = {};
    private taskLockMap: StatusMap = {};
    private taskWaitQueue: StatusMap = {};
    private globalConfig: any = {};
    constructor(config?: any) {
        this.globalConfig = config || {};
    }

    on = (taskName: string, handle: Function) => {
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

    emit = async (taskName: string, ...arg: any[]): Promise<any> => {
        const eventsMap = this.eventsMap;
        const handleList = eventsMap[taskName] || [];
        const res = await Promise.all(
            handleList.map((handle) =>
                handle.apply(null, [...arg, this.globalConfig])
            )
        );

        if (res.length <= 1) {
            return res[0];
        } else {
            return res;
        }
    };

    off = (taskName: string, handle?: Function) => {
        const eventsMap = this.eventsMap || {};
        let handleList = eventsMap[taskName] || [];
        if (typeof handle !== "function") {
            eventsMap[taskName] = [];
        } else {
            handleList = handleList.filter((eventFn) => {
                return eventFn !== handle;
            });
            eventsMap[taskName] = handleList;
        }
    };

    registerTask = (
        taskName: string,
        handle: Function,
        devsTasks?: string[]
    ) => {
        if (this.taskLockMap[taskName]) {
            return;
        }
        const originName = taskName;
        taskName = ISymbol.for(taskName);
        const offHandle = this.on(taskName, handle);
        this.taskStatusMap[taskName] = false;

        if (
            Array.isArray(devsTasks) &&
            devsTasks.length > 0 &&
            !this.taskWaitQueue[taskName]
        ) {
            const autoStart = () => {
                const isReady = devsTasks.every(
                    (name) => this.taskStatusMap[ISymbol.for(name)]
                );
                if (isReady) {
                    this.startTask(originName);
                    this.off(ISymbol.for(FINISH_TASK), autoStart);
                    this.taskWaitQueue[taskName] = false;
                }
            };
            this.on(ISymbol.for(FINISH_TASK), autoStart);
            this.taskWaitQueue[taskName] = true;
            setTimeout(() => {
                this.emit(ISymbol.for(FINISH_TASK));
            }, 0);
        }
        return offHandle;
    };

    startTask = async (taskName: string, ...arg: any[]): Promise<any> => {
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

    startTaskDevs = (taskName: string, ...arg: any[]) => {
        const devsTasks = arg[arg.length - 1];
        if (
            !Array.isArray(devsTasks) ||
            devsTasks.length <= 0 ||
            this.taskLockMap[ISymbol.for(taskName)]
        ) {
            return;
        }
        let _resolve: Function;
        const autoStart = async () => {
            const isReady = devsTasks.every(
                (name) => this.taskStatusMap[ISymbol.for(name)]
            );
            if (isReady) {
                const res = await this.startTask(taskName);
                this.off(ISymbol.for(FINISH_TASK), autoStart);
                this.taskWaitQueue[taskName] = false;
                _resolve && _resolve(res);
            }
        };

        this.on(ISymbol.for(FINISH_TASK), autoStart);
        this.taskWaitQueue[ISymbol.for(taskName)] = true;
        this.emit(ISymbol.for(FINISH_TASK));

        return new Promise<any>((resolve) => {
            _resolve = (data) => {
                resolve(data);
            };
        });
    };
}

export default EventPlan;
