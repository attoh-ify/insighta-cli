import fs from "fs";
import os from "os";
import path from "path";

export type Credentials = {
  access_token: string;
  refresh_token: string;
  username?: string;
};

const CONFIG_DIR = path.join(os.homedir(), ".insighta");
const CREDENTIALS_PATH = path.join(CONFIG_DIR, "credentials.json");

export function saveCredentials(credentials: Credentials): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(
    CREDENTIALS_PATH,
    JSON.stringify(credentials, null, 2),
    "utf-8"
  );
}

export function getCredentials(): Credentials | null {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    return null;
  }

  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  return JSON.parse(raw) as Credentials;
}

export function clearCredentials(): void {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    fs.unlinkSync(CREDENTIALS_PATH);
  }
}

export function hasCredentials(): boolean {
  return fs.existsSync(CREDENTIALS_PATH);
}