"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRequest = apiRequest;
exports.apiRawRequest = apiRawRequest;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const credential_service_1 = require("./credential.service");
const api = axios_1.default.create({
    baseURL: config_1.config.apiUrl,
    headers: {
        "X-API-Version": "1",
    },
});
async function refreshAccessToken() {
    const credentials = (0, credential_service_1.getCredentials)();
    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.refresh_token)) {
        throw new Error("You are not logged in. Run: insighta login");
    }
    const response = await axios_1.default.post(`${config_1.config.apiUrl}/auth/refresh`, {
        refresh_token: credentials.refresh_token,
    });
    const updatedCredentials = {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        username: response.data.username || credentials.username,
    };
    (0, credential_service_1.saveCredentials)(updatedCredentials);
    return updatedCredentials.access_token;
}
async function apiRequest(configOptions) {
    var _a, _b, _c, _d, _e;
    const credentials = (0, credential_service_1.getCredentials)();
    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.access_token)) {
        throw new Error("You are not logged in. Run: insighta login");
    }
    try {
        const response = await api.request({
            ...configOptions,
            headers: {
                ...configOptions.headers,
                Authorization: `Bearer ${credentials.access_token}`,
            },
        });
        return response.data;
    }
    catch (error) {
        const err = error;
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
            try {
                const newAccessToken = await refreshAccessToken();
                const retryResponse = await api.request({
                    ...configOptions,
                    headers: {
                        ...configOptions.headers,
                        Authorization: `Bearer ${newAccessToken}`,
                    },
                });
                return retryResponse.data;
            }
            catch (refreshError) {
                // If refresh_token itself is expired, clear creds and ask user to re-login
                (0, credential_service_1.clearCredentials)();
                throw new Error("Session expired. Please run: insighta login");
            }
        }
        const message = ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) ||
            ((_e = (_d = err.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) ||
            err.message;
        throw new Error(message);
    }
}
/**
 * Raw request that returns the full Axios response (needed for binary/CSV downloads).
 */
async function apiRawRequest(configOptions) {
    var _a, _b, _c, _d, _e;
    const credentials = (0, credential_service_1.getCredentials)();
    if (!(credentials === null || credentials === void 0 ? void 0 : credentials.access_token)) {
        throw new Error("You are not logged in. Run: insighta login");
    }
    const makeRequest = (token) => api.request({
        ...configOptions,
        headers: {
            ...configOptions.headers,
            Authorization: `Bearer ${token}`,
        },
    });
    try {
        return await makeRequest(credentials.access_token);
    }
    catch (error) {
        const err = error;
        if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
            try {
                const newAccessToken = await refreshAccessToken();
                return await makeRequest(newAccessToken);
            }
            catch {
                (0, credential_service_1.clearCredentials)();
                throw new Error("Session expired. Please run: insighta login");
            }
        }
        const message = ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) ||
            ((_e = (_d = err.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) ||
            err.message;
        throw new Error(message);
    }
}
