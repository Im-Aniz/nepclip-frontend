import axios from "axios";

const ACCESS = "nc-access", REFRESH = "nc-refresh";
export const tokens = {
  get access() { return localStorage.getItem(ACCESS); },
  get refresh() { return localStorage.getItem(REFRESH); },
  set({ access, refresh }) { if (access) localStorage.setItem(ACCESS, access); if (refresh) localStorage.setItem(REFRESH, refresh); },
  clear() { localStorage.removeItem(ACCESS); localStorage.removeItem(REFRESH); },
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((cfg) => {
  if (tokens.access) cfg.headers.Authorization = `Bearer ${tokens.access}`;
  return cfg;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");
    if (error.response?.status === 401 && !original._retry && tokens.refresh && !isAuthCall) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh: tokens.refresh }).finally(() => (refreshing = null));
        const { data } = await refreshing;
        tokens.set(data);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        tokens.clear();
        window.dispatchEvent(new Event("nc-logout"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body) => api.post(url, body).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const patch = (url, body) => api.patch(url, body).then((r) => r.data);
export const del = (url) => api.delete(url).then((r) => r.data);
