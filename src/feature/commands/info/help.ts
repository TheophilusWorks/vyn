import prettyMilliseconds from "pretty-ms";
import { VynCommand } from "../../../core/command/VynCommand.js";
import { ExecutePayload } from "../../../types.js";
import { formatMsg } from "../../utils/formatMsg.js";
import { usageFormatter } from "../../utils/usageFormatter.js";
import { capitalize } from "../../utils/capitalize.js";

export default new VynCommand({
  name: "help",
  description:
    "Sends a list of all commands or detailed info about a specific command",
  argsInfo: [
    {
      type: "argument",
      name: "cmd",
      description: "The command to get detailed info about",
    },
  ],

  execute: async (ctx) => {
    let cmdName = ctx.getArgument("cmd");
    if (cmdName) {
      return inspectCommand(ctx, cmdName);
    }

    showHelp(ctx);
  },
});

async function showHelp(ctx: ExecutePayload) {
  let cmds = ctx.vyn.getAllCommandsByCategory();
  let body: string[] = [];

  for (let [category, cmdArr] of cmds.entries()) {
    let buffer: string[] = [];
    for (let cmd of cmdArr) {
      buffer.push(`    — ${cmd.name}`);
    }

    body.push(`${capitalize(category)}\n` + buffer.join("\n"));
  }

  ctx.reply(
    formatMsg({
      header: "Help",
      subheader: "List of all commands",
      body,
      footer:
        "Type `%help cmd:<command>` to get detailed info about a specific command",
    }),
  );
}

async function inspectCommand(ctx: ExecutePayload, cmdName: string) {
  let command = ctx.vyn.getCommand(cmdName);

  if (!command) {
    throw new Error(`Command '${cmdName}' does not exist`);
  }

  let body: string[] = [
    `Name: ${command.name}`,
    `Description: ${command.description}`,
    `Aliases: ${command.aliases?.join(" | ") || "None"}`,
    `Usage: ${usageFormatter(ctx.prefix, command)}`,
  ];

  ctx.reply(
    formatMsg({
      header: `Inspecting command`,
      subheader: capitalize(command.name),
      body,
      footer: command.details ? command.details : [],
    }),
  );
}
