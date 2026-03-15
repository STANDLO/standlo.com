import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { getAppCheck } from "./appcheck";

/**
 * Returns the V2 Firebase Functions client instance.
 * Automatically attempts to invoke the AppCheck protection layer before connecting.
 */
export const getFunctionsClient = () => {
    // 1. Enforce AppCheck Security First!
    getAppCheck();

    // 2. Initialize the functions client bound to europe-west1
    return getFunctions(getApp(), "europe-west1");
};

/**
 * Helper to dispatch a callable function safely.
 * Usage: executeCloudFunction("dcodeSync", { moduleId: "design", action: "list", ... })
 */
export const executeCloudFunction = async (functionName: string, data: any) => {
    const functions = getFunctionsClient();
    const action = httpsCallable(functions, functionName);
    const result = await action(data);
    return result.data;
};
