import { auth } from "../firebase/config";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.REACT_APP_API_URL;
  if (!configuredUrl) {
    throw new Error("REACT_APP_API_URL must be configured for this environment.");
  }

  return validarApiUrl(configuredUrl, process.env.NODE_ENV === "production");
}

export function validarApiUrl(configuredUrl, isProduction = false) {
  let url;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("REACT_APP_API_URL must be a valid absolute URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("REACT_APP_API_URL must use HTTP or HTTPS.");
  }

  if (isProduction && (url.protocol !== "https:" || localHosts.has(url.hostname))) {
    throw new Error("Production API URL must use HTTPS and must not point to localhost.");
  }

  return url.toString().replace(/\/+$/, "");
}

export async function apiRequest(path, options = {}) {
  const { authenticated = true, headers: requestHeaders, ...fetchOptions } = options;
  const headers = new Headers(requestHeaders);

  if (authenticated) {
    const user = auth.currentUser;
    if (!user) {
      throw new ApiError("Authentication is required.", 401);
    }
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...fetchOptions,
    headers
  });
  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) {
        throw new Error("The API returned an invalid response.");
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.mensagem || data?.erro || "The API request failed.",
      response.status
    );
  }

  return data;
}
