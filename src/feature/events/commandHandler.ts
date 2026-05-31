import { MessageCreatePayload } from "@theophilusdev/conduit";
import VynEventBuilder, { VynNext } from "../../core/VynEventBuilder.js";
import { VynClient } from "../../VynClient.js";
import { ParsedCommand } from "../../core/command/VynCommandParser.js";
import { VynCommand } from "../../core/command/VynCommand.js";
import { VynDispatcher } from "../../core/VynDispatcher.js";

function resolveCommand(dispatcher: VynDispatcher, body: string) {
  const name = dispatcher.peekCommandName(body);
  return (
    dispatcher.registry.getCommand(name) ??
    dispatcher.registry.getCommandByAlias(name)
  );
}

function validateArgs(
  ctx: MessageCreatePayload,
  parsed: ParsedCommand,
  command: VynCommand,
): string | null {
  const argsInfo = command.argsInfo ?? [];

  for (const arg of argsInfo) {
    if (!arg.required) continue;

    if (arg.type === "mentionable") {
      const mentionableArgs = argsInfo.filter((a) => a.type === "mentionable");
      const index = mentionableArgs.findIndex((a) => a.name === arg.name);
      if (!Object.entries(ctx.mentions)[index]) {
        return `Missing required argument: @mention for \`${arg.name}\``;
      }
    } else {
      if (!parsed.args.get(arg.name)) {
        return `Missing required argument: \`${arg.name}\``;
      }
    }
  }

  return null;
}

export default new VynEventBuilder(
  "message:create",
  async (ctx: MessageCreatePayload, next: VynNext, _vyn: VynClient) => {
    try {
      await next();
    } catch (error) {
      let e = error as Error;
      ctx.reply(`Error: ${e.message}`);
    }
  },
  async (ctx: MessageCreatePayload, vyn: VynClient) => {
    console.log(ctx);

    const dispatcher = vyn.dispatcher;

    const command = resolveCommand(dispatcher, ctx.body);
    if (!command) return;

    if (command.adminOnly && !(await isAdmin(vyn, ctx.senderID))) {
      return;
    }

    const parsed = dispatcher.parser.parse(ctx.body, command);
    if (!parsed) return;

    await ctx.sendTypingIndicator();
    const validationError = validateArgs(ctx, parsed, command);
    if (validationError) {
      ctx.reply(validationError);
      return;
    }

    const argsInfo = command.argsInfo ?? [];
    const argumentsObject = dispatcher.buildArgumentsObject(
      parsed,
      ctx.mentions,
      argsInfo,
    );
    const payload = dispatcher.buildExecutePayload(
      ctx,
      argumentsObject,
      dispatcher.getPrefix(ctx.body),
    );
    await command.execute(payload);
  },
);

async function isAdmin(vyn: VynClient, userID: string): Promise<boolean> {
  let thread = await vyn.client.threads.getInfo(userID);
  return thread.adminIDs.some((a: any) => a.id === userID) as boolean;
}
