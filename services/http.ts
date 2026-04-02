import axios from "axios";
import { useAppStore } from "@/store/app-store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export const http = axios.create({
  baseURL,
  timeout: 45000
});

http.interceptors.request.use((config) => {
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["x-superhero-client"] = "superhero-ai-ide";
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ??
      error.message ??
      "Unexpected network error.";
    return Promise.reject(new Error(message));
  }
);

export { baseURL };
