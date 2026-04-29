"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerProfileCommands = registerProfileCommands;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_service_1 = require("../services/api.service");
function buildProfileTable(profiles) {
    const table = new cli_table3_1.default({
        head: [
            chalk_1.default.cyan("ID"),
            chalk_1.default.cyan("Name"),
            chalk_1.default.cyan("Gender"),
            chalk_1.default.cyan("Age"),
            chalk_1.default.cyan("Age Group"),
            chalk_1.default.cyan("Country"),
        ],
        wordWrap: true,
    });
    profiles.forEach((profile) => {
        var _a, _b, _c, _d, _e, _f;
        table.push([
            (_a = profile.id) !== null && _a !== void 0 ? _a : "-",
            (_b = profile.name) !== null && _b !== void 0 ? _b : "-",
            (_c = profile.gender) !== null && _c !== void 0 ? _c : "-",
            (_d = profile.age) !== null && _d !== void 0 ? _d : "-",
            (_e = profile.age_group) !== null && _e !== void 0 ? _e : "-",
            (_f = profile.country_id) !== null && _f !== void 0 ? _f : "-",
        ]);
    });
    return table;
}
function printPaginationInfo(result) {
    var _a, _b, _c, _d;
    console.log(chalk_1.default.gray(`Page ${(_a = result.page) !== null && _a !== void 0 ? _a : 1}/${(_b = result.total_pages) !== null && _b !== void 0 ? _b : 1} | Total: ${(_c = result.total) !== null && _c !== void 0 ? _c : 0}` +
        (((_d = result.links) === null || _d === void 0 ? void 0 : _d.next) ? ` | Next: ${result.links.next}` : "")));
}
function registerProfileCommands(program) {
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
        var _a;
        const spinner = (0, ora_1.default)("Fetching profiles...").start();
        try {
            const params = new URLSearchParams();
            if (options.gender)
                params.append("gender", options.gender);
            if (options.country)
                params.append("country_id", options.country);
            if (options.ageGroup)
                params.append("age_group", options.ageGroup);
            if (options.minAge)
                params.append("min_age", options.minAge);
            if (options.maxAge)
                params.append("max_age", options.maxAge);
            if (options.sortBy)
                params.append("sort_by", options.sortBy);
            if (options.order)
                params.append("order", options.order);
            params.append("page", options.page);
            params.append("limit", options.limit);
            const result = await (0, api_service_1.apiRequest)({
                method: "GET",
                url: `/api/profiles?${params.toString()}`,
            });
            spinner.succeed(`Fetched ${((_a = result.data) !== null && _a !== void 0 ? _a : []).length} profile(s)`);
            if (!result.data || result.data.length === 0) {
                console.log(chalk_1.default.yellow("No profiles found."));
                return;
            }
            console.log(buildProfileTable(result.data).toString());
            printPaginationInfo(result);
        }
        catch (error) {
            spinner.fail(error.message);
        }
    });
    // ── GET ─────────────────────────────────────────────────────────────────
    profiles
        .command("get")
        .argument("<id>", "Profile UUID")
        .description("Get a single profile by ID")
        .action(async (id) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const spinner = (0, ora_1.default)("Fetching profile...").start();
        try {
            const result = await (0, api_service_1.apiRequest)({
                method: "GET",
                url: `/api/profiles/${id}`,
            });
            spinner.succeed("Profile fetched");
            const profile = (_a = result.data) !== null && _a !== void 0 ? _a : result;
            const table = new cli_table3_1.default({
                head: [chalk_1.default.cyan("Field"), chalk_1.default.cyan("Value")],
                colWidths: [25, 55],
            });
            const fields = [
                ["ID", (_b = profile.id) !== null && _b !== void 0 ? _b : "-"],
                ["Name", (_c = profile.name) !== null && _c !== void 0 ? _c : "-"],
                ["Gender", (_d = profile.gender) !== null && _d !== void 0 ? _d : "-"],
                ["Gender Probability", profile.gender_probability != null ? String(profile.gender_probability) : "-"],
                ["Age", profile.age != null ? String(profile.age) : "-"],
                ["Age Group", (_e = profile.age_group) !== null && _e !== void 0 ? _e : "-"],
                ["Country ID", (_f = profile.country_id) !== null && _f !== void 0 ? _f : "-"],
                ["Country Name", (_g = profile.country_name) !== null && _g !== void 0 ? _g : "-"],
                ["Country Probability", profile.country_probability != null ? String(profile.country_probability) : "-"],
                ["Created At", profile.created_at ? new Date(profile.created_at).toLocaleString() : "-"],
            ];
            fields.forEach(([k, v]) => table.push([k, v]));
            console.log(table.toString());
        }
        catch (error) {
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
        var _a;
        const spinner = (0, ora_1.default)("Searching profiles...").start();
        try {
            const params = new URLSearchParams({
                q: query,
                page: options.page,
                limit: options.limit,
            });
            const result = await (0, api_service_1.apiRequest)({
                method: "GET",
                url: `/api/profiles/search?${params.toString()}`,
            });
            spinner.succeed(`Found ${((_a = result.data) !== null && _a !== void 0 ? _a : []).length} result(s)`);
            if (!result.data || result.data.length === 0) {
                console.log(chalk_1.default.yellow("No profiles matched your query."));
                return;
            }
            console.log(buildProfileTable(result.data).toString());
            printPaginationInfo(result);
        }
        catch (error) {
            spinner.fail(error.message);
        }
    });
    // ── CREATE ──────────────────────────────────────────────────────────────
    profiles
        .command("create")
        .description("Create a new profile (admin only)")
        .requiredOption("--name <name>", "Name of the person to profile")
        .action(async (options) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const spinner = (0, ora_1.default)(`Creating profile for "${options.name}"...`).start();
        try {
            console.log("get here");
            console.log({ name: options.name });
            const result = await (0, api_service_1.apiRequest)({
                method: "POST",
                url: "/api/profiles",
                data: { name: options.name },
            });
            spinner.succeed("Profile created successfully");
            const profile = (_a = result.data) !== null && _a !== void 0 ? _a : result;
            const table = new cli_table3_1.default({
                head: [chalk_1.default.cyan("Field"), chalk_1.default.cyan("Value")],
                colWidths: [25, 55],
            });
            const fields = [
                ["ID", (_b = profile.id) !== null && _b !== void 0 ? _b : "-"],
                ["Name", (_c = profile.name) !== null && _c !== void 0 ? _c : "-"],
                ["Gender", (_d = profile.gender) !== null && _d !== void 0 ? _d : "-"],
                ["Gender Probability", profile.gender_probability != null ? String(profile.gender_probability) : "-"],
                ["Age", profile.age != null ? String(profile.age) : "-"],
                ["Age Group", (_e = profile.age_group) !== null && _e !== void 0 ? _e : "-"],
                ["Country ID", (_f = profile.country_id) !== null && _f !== void 0 ? _f : "-"],
                ["Country Name", (_g = profile.country_name) !== null && _g !== void 0 ? _g : "-"],
                ["Country Probability", profile.country_probability != null ? String(profile.country_probability) : "-"],
                ["Created At", profile.created_at ? new Date(profile.created_at).toLocaleString() : "-"],
            ];
            fields.forEach(([k, v]) => table.push([k, v]));
            console.log(table.toString());
        }
        catch (error) {
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
        const spinner = (0, ora_1.default)("Exporting profiles...").start();
        try {
            const params = new URLSearchParams();
            params.append("format", options.format);
            if (options.gender)
                params.append("gender", options.gender);
            if (options.country)
                params.append("country_id", options.country);
            if (options.ageGroup)
                params.append("age_group", options.ageGroup);
            if (options.minAge)
                params.append("min_age", options.minAge);
            if (options.maxAge)
                params.append("max_age", options.maxAge);
            if (options.sortBy)
                params.append("sort_by", options.sortBy);
            if (options.order)
                params.append("order", options.order);
            // Use raw request so we get the actual CSV bytes, not parsed JSON
            const response = await (0, api_service_1.apiRawRequest)({
                method: "GET",
                url: `/api/profiles/export?${params.toString()}`,
                responseType: "arraybuffer",
            });
            const timestamp = Date.now();
            const filename = `profiles_${timestamp}.csv`;
            const filePath = path_1.default.join(process.cwd(), filename);
            fs_1.default.writeFileSync(filePath, Buffer.from(response.data));
            spinner.succeed(`CSV exported → ${chalk_1.default.green(filePath)}`);
        }
        catch (error) {
            spinner.fail(error.message);
        }
    });
}
