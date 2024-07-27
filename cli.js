#!/usr/bin/env node
import { Command } from "commander";
import { generateFilesForAllOrganizationContents } from "./mainFunctionalities/generatingData.js";
import transferFiles from "./mainFunctionalities/transferFiles.js";
import { exec } from "child_process"; // Import exec

const program = new Command();

// Define the transfer command
program
  .command("transfer")
  .description("Transfer files from GridFS to MinIO")
  .action(() => {
    transferFiles();
  });

// Define the simulate command
program
  .command("simulate")
  .description("Simulate some process")
  .action(() => {
    generateFilesForAllOrganizationContents();
  });

// Define the start command
program
  .command("server")
  .description("Start the server")
  .action(() => {
    exec("node server.js", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting server: ${error}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });
  });

program.parse(process.argv);
