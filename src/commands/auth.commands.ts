import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { login, logout } from "../services/auth.service";
import { getCredentials } from "../services/credential.service";
import { apiRequest } from "../services/api.service";

export function registerAuthCommands(program: Command) {
  program
    .command("login")
    .description("Login with GitHub")
    .action(async () => {
      await login();
    });

  program
    .command("logout")
    .description("Logout from Insighta")
    .action(async () => {
      await logout();
    });

  program
    .command("whoami")
    .description("Show current authenticated user")
    .action(async () => {
      const credentials = getCredentials();
      
      if (!credentials) {
        console.log(chalk.red("You are not logged in. Run: insighta login"));
        return;
      }
      
      const spinner = ora("Fetching user info...").start();
      
      try {
        const result = await apiRequest<any>({
          method: "GET",
          url: "/auth/me",
        });
        
        spinner.stop();

        const user = result.data || result;

        const table = new Table({
          head: [chalk.cyan("Field"), chalk.cyan("Value")],
          colWidths: [20, 50],
        });

        table.push(
          ["Username", user.username ? `@${user.username}` : "-"],
          ["Email", user.email || "-"],
          ["Role", user.role || "-"],
          ["GitHub ID", user.github_id || "-"],
          ["Active", user.is_active !== undefined ? (user.is_active ? "Yes" : "No") : "-"],
          ["Last Login", user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "-"],
          ["Member Since", user.created_at ? new Date(user.created_at).toLocaleString() : "-"]
        );

        console.log(table.toString());
      } catch (error: any) {
        // Fallback to locally stored credentials if /auth/me doesn't exist
        spinner.stop();
        console.log(
          chalk.green(
            `Logged in${credentials.username ? ` as @${credentials.username}` : ""}`
          )
        );
        if (error.message && !error.message.includes("404")) {
          console.log(chalk.yellow(`Note: ${error.message}`));
        }
      }
    });
}