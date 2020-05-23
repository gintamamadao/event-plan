declare class EventPlan {
    private eventsMap;
    private taskStatusMap;
    private taskLockMap;
    private taskWaitQueue;
    private globalConfig;
    constructor(config?: any);
    on: (taskName: string, handle: Function) => () => void;
    emit: (taskName: string, ...arg: any[]) => Promise<any>;
    off: (taskName: string, handle?: Function | undefined) => void;
    registerTask: (taskName: string, handle: Function, devsTasks?: string[] | undefined) => (() => void) | undefined;
    startTask: (taskName: string, ...arg: any[]) => Promise<any>;
    startTaskDevs: (taskName: string, ...arg: any[]) => Promise<any> | undefined;
}
export default EventPlan;
