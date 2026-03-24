export const logger = {
  info: (msg: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${msg}`, data || "");
    }
  },
  error: (msg: string, data?: any) => {
    console.error(`[ERROR] ${msg}`, data || "");
  }
};
