"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const open_1 = __importDefault(require("open"));
const axios_1 = __importDefault(require("axios"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../config");
const credential_service_1 = require("./credential.service");
const pkce_1 = require("../utils/pkce");
const api_service_1 = require("./api.service");
const port = process.env.PORT || 8976;
async function login() {
    const state = (0, pkce_1.generateState)();
    const codeVerifier = (0, pkce_1.generateCodeVerifier)();
    const codeChallenge = (0, pkce_1.generateCodeChallenge)(codeVerifier);
    const callbackUrl = process.env.BASE_URL || `http://localhost:${port}/callback`;
    const authUrl = `${config_1.config.apiUrl}/auth/github` +
        `?client=cli` +
        `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}`;
    console.log(chalk_1.default.blue("Opening GitHub login in your browser..."));
    const server = http_1.default.createServer(async (req, res) => {
        var _a, _b, _c;
        const spinner = (0, ora_1.default)("Completing login...");
        try {
            if (!((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/callback"))) {
                res.writeHead(404);
                res.end("Not found");
                return;
            }
            const url = new URL(req.url, callbackUrl);
            const code = url.searchParams.get("code");
            const returnedState = url.searchParams.get("state");
            if (!code || !returnedState || returnedState !== state) {
                res.writeHead(400);
                res.end("Invalid OAuth callback.");
                server.close();
                return;
            }
            spinner.start();
            const response = await axios_1.default.post(`${config_1.config.apiUrl}/auth/github/cli/callback`, {
                code,
                state,
                code_verifier: codeVerifier,
                redirect_uri: callbackUrl,
            });
            (0, credential_service_1.saveCredentials)({
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                username: response.data.username,
            });
            spinner.succeed(`Logged in${response.data.username ? ` as @${response.data.username}` : ""}`);
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end("<html><body style='font-family:sans-serif;text-align:center;padding:40px'>" +
                "<h2>✅ Login successful!</h2><p>You can close this tab and return to your terminal.</p>" +
                "</body></html>");
            server.close();
        }
        catch (error) {
            const message = ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || error.message;
            spinner.fail(message);
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end("<html><body style='font-family:sans-serif;text-align:center;padding:40px'>" +
                "<h2>❌ Login failed.</h2><p>Check your terminal for details.</p>" +
                "</body></html>");
            server.close();
        }
    });
    server.listen(port, async () => {
        await (0, open_1.default)(authUrl);
    });
}
async function logout() {
    const creds = (0, credential_service_1.getCredentials)();
    if (!creds) {
        console.log(chalk_1.default.yellow("You are not logged in."));
        return;
    }
    try {
        await (0, api_service_1.apiRequest)({
            method: "POST",
            url: "/auth/logout",
            data: {
                refresh_token: creds.refresh_token,
            },
        });
    }
    catch {
        // ignore backend failure — still clear locally
    }
    (0, credential_service_1.clearCredentials)();
    console.log(chalk_1.default.green("Logged out successfully."));
}
