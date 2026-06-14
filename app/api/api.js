import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "./auth";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_PORT || "http://localhost:8000"
).replace(/\/+$/, "") + "/";

const api = axios.create({
  baseURL: BASE_URL,
  // Required so the browser sends the httpOnly refresh cookie on /api/token/refresh/.
  withCredentials: true,
});

// Attach the in-memory access token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Dedupe concurrent refresh attempts so a burst of 401s only triggers one refresh.
let refreshing = null;

function refreshAccessToken() {
  if (!refreshing) {
    refreshing = axios
      .post(`${BASE_URL}api/token/refresh/`, null, { withCredentials: true })
      .then((res) => {
        const access = res.data?.access || null;
        setAccessToken(access);
        return access;
      })
      .catch((err) => {
        clearAccessToken();
        throw err;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        if (!newAccess) return Promise.reject(error);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
