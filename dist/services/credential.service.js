"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCredentials = saveCredentials;
exports.getCredentials = getCredentials;
exports.clearCredentials = clearCredentials;
exports.hasCredentials = hasCredentials;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), ".insighta");
const CREDENTIALS_PATH = path_1.default.join(CONFIG_DIR, "credentials.json");
function saveCredentials(credentials) {
    if (!fs_1.default.existsSync(CONFIG_DIR)) {
        fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs_1.default.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2), "utf-8");
}
function getCredentials() {
    if (!fs_1.default.existsSync(CREDENTIALS_PATH)) {
        return null;
    }
    const raw = fs_1.default.readFileSync(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw);
}
function clearCredentials() {
    if (fs_1.default.existsSync(CREDENTIALS_PATH)) {
        fs_1.default.unlinkSync(CREDENTIALS_PATH);
    }
}
function hasCredentials() {
    return fs_1.default.existsSync(CREDENTIALS_PATH);
}
