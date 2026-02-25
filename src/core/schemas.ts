// This file acts as a proxy to the Single Source of Truth backend schemas
// The UI and Next.js frontend now purely render from these types, which in the future 
// will be strictly JSON downloaded from WebInterface Gateway.
export * from "../../functions/src/schemas";
