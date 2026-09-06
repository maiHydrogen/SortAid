// Central place for backend API configuration, so no component hardcodes
// http://localhost:8000 directly — set VITE_API_URL in .env for other
// environments (see .env.example).
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Small fetch wrapper that attaches the stored JWT (if any) as a Bearer
// token. Use this for any request that hits an authenticated route.
export const authFetch = (path, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
};
