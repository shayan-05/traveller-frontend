import axios from "axios";

const backendBase = import.meta.env.VITE_BACKEND_API;

function getBackendBase() {
  const backendUrl = new URL(backendBase);
  const browserHost = window.location.hostname;
  const isLoopbackHost = (host) => host === "localhost" || host === "127.0.0.1";

  if (
    import.meta.env.DEV &&
    isLoopbackHost(backendUrl.hostname) &&
    isLoopbackHost(browserHost)
  ) {
    backendUrl.hostname = browserHost;
  }

  return backendUrl.toString().replace(/\/$/, "");
}

export function getAuthTokenFromCookies(role = "driver") {
  const cookies = Object.fromEntries(
    document.cookie
      .split(";")
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex < 0) return null;

        return [
          decodeURIComponent(cookie.slice(0, separatorIndex).trim()),
          decodeURIComponent(cookie.slice(separatorIndex + 1)),
        ];
      })
      .filter(Boolean)
  );

  return role === "driver"
    ? cookies.driverAccessToken || ""
    : cookies.userAccessToken || "";
}
export function apiUrl(path = "") {
  return `${getBackendBase()}/${path.replace(/^\/+/, "")}`;
}

export function socketUrl() {
  const api = new URL(getBackendBase());
  return `${api.protocol}//${api.host}`;
}

axios.interceptors.request.use((config) => {
  const token = getAuthTokenFromCookies();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
