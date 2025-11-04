// src/lib/api.js
import axios from "axios";
import { toast } from "react-toastify";

/**
 * API client for Sweetify frontend
 * - baseURL picks VITE_API_URL or falls back to http://127.0.0.1:5001/api
 * - request interceptor prefers an already-set Authorization header (from setAuthToken)
 *   and falls back to localStorage token only if header is not present (prevents accidental overwrite).
 * - improved response interceptor: clear handling for network errors (no response),
 *   avoids duplicate toasts for stock/quantity messages, and central 401 handling.
 */

/* Toggle to true while debugging to log outgoing requests (headers + url) */
const DEBUG_REQUESTS = false;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5001/api",
  timeout: 20000,
});

// REQUEST INTERCEPTOR
API.interceptors.request.use(
  (config) => {
    // ensure headers object exists
    config.headers = config.headers || {};

    // If Authorization header already present (maybe set per-request or via setAuthToken),
    // do not overwrite it. Otherwise, read token from localStorage.
    if (!config.headers["Authorization"]) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    if (DEBUG_REQUESTS) {
      // eslint-disable-next-line no-console
      console.log(
        "[API request]",
        (config.method || "").toUpperCase(),
        `${config.baseURL || ""}${config.url || ""}`,
        config.headers
      );
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network-level error (no response) — show clearer message + log details for debugging.
    if (!err || !err.response) {
      // eslint-disable-next-line no-console
      console.error("[API] Network error or no response:", err);
      // Friendly toast for network/CORS/timeouts
      toast.error("Network error — check server or your connection");
      return Promise.reject(err);
    }

    const response = err.response;
    const message = response?.data?.message || err.message || "Network error";
    const code = response?.status;

    // Messages that are handled by UI: don't repeat toasts here
    const lowerMsg = String(message).toLowerCase();
    const handledByUI =
      lowerMsg.includes("stock") ||
      lowerMsg.includes("quantity") ||
      lowerMsg.includes("insufficient");

    // Only show toast here for non-UI-handled errors and non-401
    if (code !== 401 && !handledByUI) {
      toast.error(message);
    }

    // Central 401 handling: clear stored credentials
    if (code === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.info("Session expired — please login again");
    }

    // log for easier debugging
    if (DEBUG_REQUESTS) {
      // eslint-disable-next-line no-console
      console.error("[API] response error", { status: code, message, data: response?.data });
    }

    return Promise.reject(err);
  }
);

/**
 * Utility to set Authorization header for all future requests (used after login/register)
 * Use setAuthToken(token) right after you get token from server so outgoing requests use it.
 */
export function setAuthToken(token) {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
}

export default API;