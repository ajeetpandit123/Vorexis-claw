#!/usr/bin/env bun

import {Command} from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command();

program
  .name("vorexis-claw")
  .description("A self-evolving intelligent core that controls and connects everything.")
  .version("1.0.0");            
;


program
  .command("wakeup")
  .description("A self-evolving command intelligence that awakens systems, binds workflows, and turns intent into execution.")
  .action(async () => {
    await runWakeup();
  });   

  await program.parseAsync(process.argv);

