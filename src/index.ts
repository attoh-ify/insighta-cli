#!/usr/bin/env node

import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth.commands";
import { registerProfileCommands } from "./commands/profile.commands";

const program = new Command();

program
  .name("insighta")
  .description("CLI for Insighta Labs+")
  .version("1.0.0");

registerAuthCommands(program);
registerProfileCommands(program);

program.parse(process.argv);