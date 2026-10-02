const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("foundation_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("foundation_token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("foundation_token");
    localStorage.removeItem("foundation_user");
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("foundation_user");
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("foundation_user", JSON.stringify(user));
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `Request failed with status ${res.status}`;
    let errData = null;
    try {
      errData = await res.json();
      if (errData?.error?.message) {
        errMessage = errData.error.message;
      } else if (errData?.detail) {
        errMessage = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(errMessage, res.status, errData);
  }

  return res.json();
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: "GET", ...options }),
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};
