import { AnyFunction } from './rollup-plugin-add-global-ts_@global'
export interface EventPlanInfo {
    name: string;
    handle: AnyFunction;
    weight?: number;
    before?: string;
    after?: string;
}
declare class Plan {
    private isAsync;
    private eventChain;
    private eventsEmitt;
    private eventQueue;
    private planInfoMap;
    constructor(context?: any, isAsync?: boolean);
    addToPlan: (info: EventPlanInfo) => void;
    private addByWeight;
    private addByBefore;
    private addByAfter;
    private findNodeTopLegalBefore;
    private findNodeTopLegalAfter;
    getPlanInfos: () => EventPlanInfo[];
    getPlan: () => string[];
    private emitEvent;
    execPlan: () => void;
    execAsyncPlan: () => Promise<void>;
}
export default Plan;
