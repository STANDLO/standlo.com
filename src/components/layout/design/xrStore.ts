"use client";

import { createXRStore } from "@react-three/xr";

export const xrStore = typeof window !== "undefined" 
    ? createXRStore({ emulate: false, offerSession: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : ({} as any);
