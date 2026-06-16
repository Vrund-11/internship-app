/**
 * Platform-agnostic logger.
 *
 * Uses __DEV__ (React Native) or process.env.NODE_ENV (Next.js) to gate
 * verbose logging.  Both environments define at least one of these.
 */
const isDev = (): boolean => {
  // React Native / Expo sets the __DEV__ global.
  if (typeof __DEV__ !== "undefined") return __DEV__;
  // Next.js / Node
  if (typeof process !== "undefined") return process.env.NODE_ENV === "development";
  return false;
};

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev()) {
      console.log(`[INFO] ${msg}`, data || "");
    }
  },
  warn: (msg: string, data?: unknown) => {
    if (isDev()) {
      console.warn(`[WARN] ${msg}`, data || "");
    }
  },
  error: (msg: string, data?: unknown) => {
    console.error(`[ERROR] ${msg}`, data || "");
  },
};
