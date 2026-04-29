import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { config } from "../config";
import {
  clearCredentials,
  getCredentials,
  saveCredentials,
} from "./credential.service";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    "X-API-Version": "1",
  },
});

async function refreshAccessToken(): Promise<string> {
  const credentials = getCredentials();

  if (!credentials?.refresh_token) {
    throw new Error("You are not logged in. Run: insighta login");
  }

  const response = await axios.post(`${config.apiUrl}/auth/refresh`, {
    refresh_token: credentials.refresh_token,
  });

  const updatedCredentials = {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token,
    username: response.data.username || credentials.username,
  };

  saveCredentials(updatedCredentials);

  return updatedCredentials.access_token;
}

export async function apiRequest<T = any>(
  configOptions: AxiosRequestConfig
): Promise<T> {
  const credentials = getCredentials();

  if (!credentials?.access_token) {
    throw new Error("You are not logged in. Run: insighta login");
  }

  try {
    const response = await api.request<T>({
      ...configOptions,
      headers: {
        ...configOptions.headers,
        Authorization: `Bearer ${credentials.access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    const err = error as AxiosError<any>;

    if (err.response?.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken();

        const retryResponse = await api.request<T>({
          ...configOptions,
          headers: {
            ...configOptions.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        });

        return retryResponse.data;
      } catch (refreshError: any) {
        // If refresh_token itself is expired, clear creds and ask user to re-login
        clearCredentials();
        throw new Error("Session expired. Please run: insighta login");
      }
    }

    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message;

    throw new Error(message);
  }
}

/**
 * Raw request that returns the full Axios response (needed for binary/CSV downloads).
 */
export async function apiRawRequest(
  configOptions: AxiosRequestConfig
): Promise<import("axios").AxiosResponse> {
  const credentials = getCredentials();

  if (!credentials?.access_token) {
    throw new Error("You are not logged in. Run: insighta login");
  }

  const makeRequest = (token: string) =>
    api.request({
      ...configOptions,
      headers: {
        ...configOptions.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  try {
    return await makeRequest(credentials.access_token);
  } catch (error) {
    const err = error as AxiosError<any>;

    if (err.response?.status === 401) {
      try {
        const newAccessToken = await refreshAccessToken();
        return await makeRequest(newAccessToken);
      } catch {
        clearCredentials();
        throw new Error("Session expired. Please run: insighta login");
      }
    }

    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message;

    throw new Error(message);
  }
}