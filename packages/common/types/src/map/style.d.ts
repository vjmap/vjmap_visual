import type { Map } from "vjmap";
export declare const createUpdateMapStyleObj: (map: Map, option?: Record<string, any>) => {
    removeHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
    updateStyle: (style?: any) => Promise<any>;
    getCurStyle: () => {};
};
export declare const createUpdateMapStyleRasterObj: (map: Map, option?: Record<string, any>) => {
    removeHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
    updateStyle: (style?: any) => Promise<any>;
    getCurStyle: () => {};
};
export declare const createUpdateMapStyleVectorObj: (map: Map, option?: Record<string, any>) => {
    removeHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    addHideObjectIds: (objectIds: string[], noUpdate?: boolean, isClear?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
    hideObjectIds: Set<string>;
    getClipBounds: () => any;
    updateStyle: (style?: any) => Promise<any>;
    getCurStyle: () => {};
};
