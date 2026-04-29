"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthCommands = registerAuthCommands;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const auth_service_1 = require("../services/auth.service");
const credential_service_1 = require("../services/credential.service");
const api_service_1 = require("../services/api.service");
function registerAuthCommands(program) {
    program
        .command("login")
        .description("Login with GitHub")
        .action(async () => {
        await (0, auth_service_1.login)();
    });
    program
        .command("logout")
        .description("Logout from Insighta")
        .action(async () => {
        await (0, auth_service_1.logout)();
    });
    program
        .command("whoami")
        .description("Show current authenticated user")
        .action(async () => {
        const credentials = (0, credential_service_1.getCredentials)();
        if (!credentials) {
            console.log(chalk_1.default.red("You are not logged in. Run: insighta login"));
            return;
        }
        const spinner = (0, ora_1.default)("Fetching user info...").start();
        try {
            const result = await (0, api_service_1.apiRequest)({
                method: "GET",
                url: "/auth/me",
            });
            spinner.stop();
            const user = result.data || result;
            const table = new cli_table3_1.default({
                head: [chalk_1.default.cyan("Field"), chalk_1.default.cyan("Value")],
                colWidths: [20, 50],
            });
            table.push(["Username", user.username ? `@${user.username}` : "-"], ["Email", user.email || "-"], ["Role", user.role || "-"], ["GitHub ID", user.github_id || "-"], ["Active", user.is_active !== undefined ? (user.is_active ? "Yes" : "No") : "-"], ["Last Login", user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "-"], ["Member Since", user.created_at ? new Date(user.created_at).toLocaleString() : "-"]);
            console.log(table.toString());
        }
        catch (error) {
            // Fallback to locally stored credentials if /auth/me doesn't exist
            spinner.stop();
            console.log(chalk_1.default.green(`Logged in${credentials.username ? ` as @${credentials.username}` : ""}`));
            if (error.message && !error.message.includes("404")) {
                console.log(chalk_1.default.yellow(`Note: ${error.message}`));
            }
        }
    });
}
