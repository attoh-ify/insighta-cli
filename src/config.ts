import dotenv from "dotenv";

dotenv.config();

export const config = {
  apiUrl: process.env.INSIGHTA_API_URL || "http://localhost:8080",
};