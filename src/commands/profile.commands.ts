import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import Table from "cli-table3";
import fs from "fs";
import path from "path";
import { apiRequest, apiRawRequest } from "../services/api.service";

function buildProfileTable(profiles: any[]): Table.Table {
  const table = new Table({
    head: [
      chalk.cyan("ID"),
      chalk.cyan("Name"),
      chalk.cyan("Gender"),
      chalk.cyan("Age"),
      chalk.cyan("Age Group"),
      chalk.cyan("Country"),
    ],
    wordWrap: true,
  });

  profiles.forEach((profile: any) => {
    table.push([
      profile.id ?? "-",
      profile.name ?? "-",
      profile.gender ?? "-",
      profile.age ?? "-",
      profile.age_group ?? "-",
      profile.country_id ?? "-",
    ]);
  });

  return table;
}

function printPaginationInfo(result: any): void {
  console.log(
    chalk.gray(
      `Page ${result.page ?? 1}/${result.total_pages ?? 1} | Total: ${result.total ?? 0}` +
        (result.links?.next ? ` | Next: ${result.links.next}` : "")
    )
  );
}

export function registerProfileCommands(program: Command) {
  const profiles = program
    .command("profiles")
    .description("Manage Insighta profiles");

  // ── LIST ────────────────────────────────────────────────────────────────
  profiles
    .command("list")
    .description("List profiles with optional filters")
    .option("--gender <gender>", "Filter by gender (male/female)")
    .option("--country <country>", "Filter by country code (e.g. NG)")
    .option("--age-group <ageGroup>", "Filter by age group (e.g. adult)")
    .option("--min-age <minAge>", "Minimum age filter")
    .option("--max-age <maxAge>", "Maximum age filter")
    .option("--sort-by <sortBy>", "Sort field (e.g. age, name)")
    .option("--order <order>", "Sort order: asc or desc")
    .option("--page <page>", "Page number", "1")
    .option("--limit <limit>", "Results per page", "10")
    .action(async (options) => {
      const spinner = ora("Fetching profiles...").start();

      try {
        const params = new URLSearchParams();

        if (options.gender) params.append("gender", options.gender);
        if (options.country) params.append("country_id", options.country);
        if (options.ageGroup) params.append("age_group", options.ageGroup);
        if (options.minAge) params.append("min_age", options.minAge);
        if (options.maxAge) params.append("max_age", options.maxAge);
        if (options.sortBy) params.append("sort_by", options.sortBy);
        if (options.order) params.append("order", options.order);
        params.append("page", options.page);
        params.append("limit", options.limit);

        const result = await apiRequest<any>({
          method: "GET",
          url: `/api/profiles?${params.toString()}`,
        });

        spinner.succeed(`Fetched ${(result.data ?? []).length} profile(s)`);

        if (!result.data || result.data.length === 0) {
          console.log(chalk.yellow("No profiles found."));
          return;
        }

        console.log(buildProfileTable(result.data).toString());
        printPaginationInfo(result);
      } catch (error: any) {
        spinner.fail(error.message);
      }
    });

  // ── GET ─────────────────────────────────────────────────────────────────
  profiles
    .command("get")
    .argument("<id>", "Profile UUID")
    .description("Get a single profile by ID")
    .action(async (id) => {
      const spinner = ora("Fetching profile...").start();

      try {
        const result = await apiRequest<any>({
          method: "GET",
          url: `/api/profiles/${id}`,
        });

        spinner.succeed("Profile fetched");

        const profile = result.data ?? result;

        const table = new Table({
          head: [chalk.cyan("Field"), chalk.cyan("Value")],
          colWidths: [25, 55],
        });

        const fields: [string, string][] = [
          ["ID", profile.id ?? "-"],
          ["Name", profile.name ?? "-"],
          ["Gender", profile.gender ?? "-"],
          ["Gender Probability", profile.gender_probability != null ? String(profile.gender_probability) : "-"],
          ["Age", profile.age != null ? String(profile.age) : "-"],
          ["Age Group", profile.age_group ?? "-"],
          ["Country ID", profile.country_id ?? "-"],
          ["Country Name", profile.country_name ?? "-"],
          ["Country Probability", profile.country_probability != null ? String(profile.country_probability) : "-"],
          ["Created At", profile.created_at ? new Date(profile.created_at).toLocaleString() : "-"],
        ];

        fields.forEach(([k, v]) => table.push([k, v]));
        console.log(table.toString());
      } catch (error: any) {
        spinner.fail(error.message);
      }
    });

  // ── SEARCH ──────────────────────────────────────────────────────────────
  profiles
    .command("search")
    .argument("<query>", "Natural language query (e.g. \"young males from nigeria\")")
    .description("Search profiles using natural language")
    .option("--page <page>", "Page number", "1")
    .option("--limit <limit>", "Results per page", "10")
    .action(async (query, options) => {
      const spinner = ora("Searching profiles...").start();

      try {
        const params = new URLSearchParams({
          q: query,
          page: options.page,
          limit: options.limit,
        });

        const result = await apiRequest<any>({
          method: "GET",
          url: `/api/profiles/search?${params.toString()}`,
        });

        spinner.succeed(`Found ${(result.data ?? []).length} result(s)`);

        if (!result.data || result.data.length === 0) {
          console.log(chalk.yellow("No profiles matched your query."));
          return;
        }

        console.log(buildProfileTable(result.data).toString());
        printPaginationInfo(result);
      } catch (error: any) {
        spinner.fail(error.message);
      }
    });

  // ── CREATE ──────────────────────────────────────────────────────────────
  profiles
    .command("create")
    .description("Create a new profile (admin only)")
    .requiredOption("--name <name>", "Name of the person to profile")
    .action(async (options) => {
      const spinner = ora(`Creating profile for "${options.name}"...`).start();

      try {
        console.log("get here")
        console.log({ name: options.name })
        const result = await apiRequest<any>({
          method: "POST",
          url: "/api/profiles",
          data: { name: options.name },
        });

        spinner.succeed("Profile created successfully");

        const profile = result.data ?? result;

        const table = new Table({
          head: [chalk.cyan("Field"), chalk.cyan("Value")],
          colWidths: [25, 55],
        });

        const fields: [string, string][] = [
          ["ID", profile.id ?? "-"],
          ["Name", profile.name ?? "-"],
          ["Gender", profile.gender ?? "-"],
          ["Gender Probability", profile.gender_probability != null ? String(profile.gender_probability) : "-"],
          ["Age", profile.age != null ? String(profile.age) : "-"],
          ["Age Group", profile.age_group ?? "-"],
          ["Country ID", profile.country_id ?? "-"],
          ["Country Name", profile.country_name ?? "-"],
          ["Country Probability", profile.country_probability != null ? String(profile.country_probability) : "-"],
          ["Created At", profile.created_at ? new Date(profile.created_at).toLocaleString() : "-"],
        ];

        fields.forEach(([k, v]) => table.push([k, v]));
        console.log(table.toString());
      } catch (error: any) {
        spinner.fail(error.message);
      }
    });

  // ── EXPORT ──────────────────────────────────────────────────────────────
  profiles
    .command("export")
    .description("Export profiles as CSV")
    .option("--format <format>", "Export format (only csv supported)", "csv")
    .option("--gender <gender>", "Filter by gender")
    .option("--country <country>", "Filter by country code")
    .option("--age-group <ageGroup>", "Filter by age group")
    .option("--min-age <minAge>", "Minimum age filter")
    .option("--max-age <maxAge>", "Maximum age filter")
    .option("--sort-by <sortBy>", "Sort field")
    .option("--order <order>", "Sort order: asc or desc")
    .action(async (options) => {
      const spinner = ora("Exporting profiles...").start();

      try {
        const params = new URLSearchParams();

        params.append("format", options.format);
        if (options.gender) params.append("gender", options.gender);
        if (options.country) params.append("country_id", options.country);
        if (options.ageGroup) params.append("age_group", options.ageGroup);
        if (options.minAge) params.append("min_age", options.minAge);
        if (options.maxAge) params.append("max_age", options.maxAge);
        if (options.sortBy) params.append("sort_by", options.sortBy);
        if (options.order) params.append("order", options.order);

        // Use raw request so we get the actual CSV bytes, not parsed JSON
        const response = await apiRawRequest({
          method: "GET",
          url: `/api/profiles/export?${params.toString()}`,
          responseType: "arraybuffer",
        });

        const timestamp = Date.now();
        const filename = `profiles_${timestamp}.csv`;
        const filePath = path.join(process.cwd(), filename);

        fs.writeFileSync(filePath, Buffer.from(response.data));

        spinner.succeed(
          `CSV exported → ${chalk.green(filePath)}`
        );
      } catch (error: any) {
        spinner.fail(error.message);
      }
    });
}