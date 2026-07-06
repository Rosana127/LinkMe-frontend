import axios from "axios";
import { useAuthStore } from "@/stores/auth";

// 创建axios实例
const request = axios.create({
  baseURL: "/api", // 使用代理路径，通过Vite代理转发到后端
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从store获取token
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    // 开发环境下的请求日志（便于调试）
    if (import.meta.env.DEV) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          params: config.params,
          data: config.data,
          hasToken: !!authStore.token,
          headers: config.headers,
        }
      );
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 开发环境下的响应日志（便于调试）
    if (import.meta.env.DEV) {
      console.log(
        `[API Response] ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }

    // 兼容多种后端返回格式：
    // 1) 统一格式 { code, message, data } -> 返回 data 当 code === 200
    // 2) 传统 RESTful 返回直接的对象或数组 (可能伴随 HTTP 200/201) -> 直接返回 response.data
    const res = response.data;

    // 如果后端使用统一 code/成功标识结构，兼容常见情况：code===200 或 code===0 或 success===true
    if (res && typeof res === "object") {
      if (Object.prototype.hasOwnProperty.call(res, "code")) {
        const okCodes = [200, "200", 0, "0"];
        if (okCodes.includes(res.code)) {
          // 如果 data 是 undefined 或 null，返回整个 res 对象（包含 message）
          // 这样调用者可以访问 message 字段
          if (res.data === undefined || res.data === null) {
            return res;
          }
          // 如果 data 存在，返回 data，但保留原始响应在 httpData 中
          const result = res.data;
          // 为了兼容性，如果 result 是对象，添加 message 字段
          if (typeof result === "object" && result !== null) {
            result._message = res.message;
          }
          return result;
        }
        let message = res.message || res.msg || "请求失败";
        // 确保消息有效，过滤掉无效消息
        if (message === 'No message available' || !message.trim()) {
          message = "请求失败";
        }
        const err = new Error(message.trim());
        // attach original response body for richer debugging
        err.httpData = res;
        err.status = response.status;
        return Promise.reject(err);
      }

      if (Object.prototype.hasOwnProperty.call(res, "success")) {
        if (res.success === true) {
          return res.data !== undefined ? res.data : res;
        }
        let message = res.message || res.error || "请求失败";
        // 确保消息有效，过滤掉无效消息
        if (message === 'No message available' || !message.trim()) {
          message = "请求失败";
        }
        const err = new Error(message.trim());
        err.httpData = res;
        err.status = response.status;
        return Promise.reject(err);
      }
    }

    // 否则当作标准 RESTful 响应直接返回（允许 200/201 等）
    return res;
  },
  (error) => {
    // 开发环境下的错误日志（便于调试）
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

    // 处理HTTP错误
    if (error.response) {
      const status = error.response.status;
      const res = error.response.data;

      if (status === 401) {
        // token过期或未授权，只有在已登录状态下才清除用户信息
        const authStore = useAuthStore();
        if (authStore.isAuthenticated) {
          authStore.logout();
        }
        // 未登录用户访问需要认证的接口时，统一显示友好的提示
        // 如果有后端返回的错误消息，优先使用；否则使用默认提示
        const errorMessage = res && res.message ? res.message : "请先登录账号";
        return Promise.reject(new Error(errorMessage));
      }

      // 如果有后端返回的错误消息，使用它
      if (res && res.message && typeof res.message === 'string' && res.message.trim() && res.message !== 'No message available') {
        const err = new Error(res.message.trim());
        err.status = status;
        err.httpData = res;
        return Promise.reject(err);
      }

      // 根据状态码返回相应的错误消息
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
      // 请求已发出但没有收到响应，可能是网络问题、CORS问题或后端服务未启动
      console.error("[Network Error] 请求已发出但未收到响应", {
        url: error.config?.url,
        message:
          "请检查：1. 后端服务是否运行 2. 代理配置是否正确 3. 网络连接是否正常",
      });
      return Promise.reject(
        new Error(
          "网络连接失败，请检查：1. 后端服务是否运行在 localhost:8081 2. 网络连接是否正常"
        )
      );
    } else {
      // 其他错误
      console.error("[Request Error]", error.message);
      // 确保错误消息有效，过滤掉 "No message available" 和空消息
      const errorMsg = error.message && error.message !== 'No message available' && error.message.trim() 
        ? error.message.trim() 
        : "请求失败，请重试";
      return Promise.reject(new Error(errorMsg));
    }
  }
);

export default request;
