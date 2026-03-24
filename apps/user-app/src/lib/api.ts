import axios from "axios";
import { logger } from "./logger";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    logger.error("API_ERROR", error?.response?.data);

    return Promise.reject(error);
  }
);
