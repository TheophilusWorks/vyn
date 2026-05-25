import { VynCommand } from "../../../core/command/VynCommand.js";
import { capitalize } from "../../utils/capitalize.js";
import { formatMsg } from "../../utils/formatMsg.js";
import { usageFormatter } from "../../utils/usageFormatter.js";

export default new VynCommand({
  name: "usage",
  description: "Replies with the usage of the bot's command",
  argsInfo: [
    {
      type: "argument",
      name: "command",
      description: "The command to get the usage of",
      required: true,
    },
  ],

  execute: async (ctx) => {
    let commandName = ctx.getArgument("command") ?? "";
    let command = ctx.vyn.getCommand(commandName);

    if (!command) {
      throw new Error(`Command "${commandName}" not found`);
    }

    ctx.reply(
      formatMsg({
        header: `Usage of ${capitalize(command.name)} command`,
        subheader: command.description,
        body: usageFormatter(ctx.vyn.config.prefix, command),
        footer: Array.isArray(command.details)
          ? command.details
          : [command.details ?? ""],
      }),
    );
  },
});
