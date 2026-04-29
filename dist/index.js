#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const auth_commands_1 = require("./commands/auth.commands");
const profile_commands_1 = require("./commands/profile.commands");
const program = new commander_1.Command();
program
    .name("insighta")
    .description("CLI for Insighta Labs+")
    .version("1.0.0");
(0, auth_commands_1.registerAuthCommands)(program);
(0, profile_commands_1.registerProfileCommands)(program);
program.parse(process.argv);
