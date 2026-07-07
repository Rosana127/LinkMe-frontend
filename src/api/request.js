import axios from "axios";
import { useAuthStore } from "@/stores/auth";

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        hasToken: !!authStore.token,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    const res = response.data;

    if (res && typeof res === "object") {
      if (Object.prototype.hasOwnProperty.call(res, "code")) {
        const okCodes = [200, "200", 0, "0"];
        if (okCodes.includes(res.code)) {
          if (res.data === undefined || res.data === null) {
            return res;
          }
          const result = res.data;
          if (typeof result === "object" && result !== null) {
            result._message = res.message;
          }
          return result;
        }

        let message = res.message || res.msg || "请求失败";
        if (message === "No message available" || !message.trim()) {
          message = "请求失败";
        }
        const err = new Error(message.trim());
        err.httpData = res;
        err.status = response.status;
        return Promise.reject(err);
      }

      if (Object.prototype.hasOwnProperty.call(res, "success")) {
        if (res.success === true) {
          return res.data !== undefined ? res.data : res;
        }
        let message = res.message || res.error || "请求失败";
        if (message === "No message available" || !message.trim()) {
          message = "请求失败";
        }
        const err = new Error(message.trim());
        err.httpData = res;
        err.status = response.status;
        return Promise.reject(err);
      }
    }

    return res;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error("[API Error]", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        request: error.request,
      });
    }

    if (error.response) {
      const status = error.response.status;
      const res = error.response.data;

      if (status === 401) {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          authStore.logout();
        }
        const errorMessage = res && res.message ? res.message : "请先登录账号";
        return Promise.reject(new Error(errorMessage));
      }

      if (res && res.message && typeof res.message === "string" && res.message.trim() && res.message !== "No message available") {
        const err = new Error(res.message.trim());
        err.status = status;
        err.httpData = res;
        return Promise.reject(err);
      }

      let message = "请求失败";
      switch (status) {
        case 400:
          message = "请求参数错误";
          break;
        case 403:
          message = "没有权限访问";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        default:
          message = `请求失败 (${status})`;
      }
      const err = new Error(message);
      err.status = status;
      err.httpData = res;
      return Promise.reject(err);
    } else if (error.request) {
      console.error("[Network Error] 请求已发出但未收到响应", {
        url: error.config?.url,
        message: "请检查：1. 后端服务是否运行 2. Vite 代理是否正确 3. 网络是否正常",
      });
      return Promise.reject(
        new Error("网络连接失败，请检查后端服务是否运行在 127.0.0.1:8080")
      );
    } else {
      console.error("[Request Error]", error.message);
      const errorMsg =
        error.message && error.message !== "No message available" && error.message.trim()
          ? error.message.trim()
          : "请求失败，请重试";
      return Promise.reject(new Error(errorMsg));
    }
  }
);

export default request;
