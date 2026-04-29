import http from "http";
import open from "open";
import axios from "axios";
import ora from "ora";
import chalk from "chalk";
import { config } from "../config";
import { saveCredentials, getCredentials, clearCredentials } from "./credential.service";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "../utils/pkce";
import { apiRequest } from "./api.service";

export async function login(): Promise<void> {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const port = 8976;
  const callbackUrl = `http://localhost:${port}/callback`;

  const authUrl =
    `${config.apiUrl}/auth/github` +
    `?client=cli` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(codeChallenge)}`;

  console.log(chalk.blue("Opening GitHub login in your browser..."));

  const server = http.createServer(async (req, res) => {
    const spinner = ora("Completing login...");

    try {
      if (!req.url?.startsWith("/callback")) {
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

      const response = await axios.post(
        `${config.apiUrl}/auth/github/cli/callback`,
        {
          code,
          state,
          code_verifier: codeVerifier,
          redirect_uri: callbackUrl,
        }
      );

      saveCredentials({
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        username: response.data.username,
      });

      spinner.succeed(
        `Logged in${response.data.username ? ` as @${response.data.username}` : ""}`
      );

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        "<html><body style='font-family:sans-serif;text-align:center;padding:40px'>" +
          "<h2>✅ Login successful!</h2><p>You can close this tab and return to your terminal.</p>" +
          "</body></html>"
      );

      server.close();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;

      spinner.fail(message);

      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(
        "<html><body style='font-family:sans-serif;text-align:center;padding:40px'>" +
          "<h2>❌ Login failed.</h2><p>Check your terminal for details.</p>" +
          "</body></html>"
      );

      server.close();
    }
  });

  server.listen(port, async () => {
    await open(authUrl);
  });
}

export async function logout(): Promise<void> {
  const creds = getCredentials();

  if (!creds) {
    console.log(chalk.yellow("You are not logged in."));
    return;
  }

  try {
    await apiRequest<any>({
      method: "POST",
      url: "/auth/logout",
      data: {
        refresh_token: creds.refresh_token,
      },
    });
  } catch {
    // ignore backend failure — still clear locally
  }

  clearCredentials();
  console.log(chalk.green("Logged out successfully."));
}