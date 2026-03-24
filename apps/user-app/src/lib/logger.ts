export const logger = {
  info: (msg: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${msg}`, data || "");
    }
  },
  error: (msg: string, data?: unknown) => {
    console.error(`[ERROR] ${msg}`, data || "");
  }
};
