import NodeCache from "node-cache";

// Global cache instance to persist across Next.js API hot-reloads in development
const globalForCache = global as unknown as { cache: NodeCache };

export const cache = globalForCache.cache || new NodeCache({ 
  stdTTL: 0, // Infinite TTL, explicitly invalidated by mutating API routes
  checkperiod: 0 
});

if (process.env.NODE_ENV !== "production") globalForCache.cache = cache;

export const CacheKeys = {
  DASHBOARD_REPORTS: "dashboard_reports",
};
