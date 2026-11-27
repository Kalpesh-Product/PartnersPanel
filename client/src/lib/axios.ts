import axios from "axios";
import { store } from "../redux/store";
import { setCredentials, logout } from "../redux/slices/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

// On a 401, try the httpOnly-cookie refresh once and retry the original
// request; if that also fails, the session is really over.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes("/auth/")) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (!refreshInFlight) {
      refreshInFlight = api
        .post("/auth/refresh")
        .then((res) => res.data.accessToken as string)
        .catch(() => null)
        .finally(() => {
          refreshInFlight = null;
        });
    }

    const newToken = await refreshInFlight;
    if (!newToken) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    const user = store.getState().auth.user;
    store.dispatch(setCredentials({ user, token: newToken }));
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return api(originalRequest);
  },
);

export default api;
