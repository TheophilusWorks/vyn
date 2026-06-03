import {
  MessageCreatePayload,
  MessageRespondPayload,
} from "@theophilusdev/conduit";
import VynEventBuilder, { VynNext } from "../../core/VynEventBuilder.js";
import { VynClient } from "../../VynClient.js";
import { ParsedCommand } from "../../core/command/VynCommandParser.js";
import { VynCommand } from "../../core/command/VynCommand.js";
import { VynDispatcher } from "../../core/VynDispatcher.js";
import { ContextPayload } from "../../types.js";
import { formatMsg } from "../utils/formatMsg.js";
import { usageFormatter } from "../utils/usageFormatter.js";

export default new VynEventBuilder("message:create", trycatch, handler);

function resolveCommand(dispatcher: VynDispatcher, body: string) {
  const name = dispatcher.peekCommandName(body);
  return (
    dispatcher.registry.getCommand(name) ??
    dispatcher.registry.getCommandByAlias(name)
  );
}

function validateArgs(
  ctx: ContextPayload,
  parsed: ParsedCommand,
  command: VynCommand,
): string | null {
  const argsInfo = command.argsInfo ?? [];
  const asRespond = ctx as unknown as MessageRespondPayload;

  const mentionCount = Object.keys(ctx.mentions).length;
  const requiredMentionableArgs = argsInfo.filter((a) => {
    if (!a.required) return false;
    const types = Array.isArray(a.type) ? a.type : [a.type];
    return types.includes("mentionable");
  });

  let mentionablesConsumed = 0;

  for (const arg of argsInfo) {
    if (!arg.required) continue;

    const types = Array.isArray(arg.type) ? arg.type : [arg.type];

    const satisfied = types.some((t) => {
      if (t === "mentionable") {
        return mentionablesConsumed < mentionCount;
      }
      if (t === "replyable") return !!asRespond.messageReply;
      return !!parsed.args.get(arg.name);
    });

    if (types.some((t) => t === "mentionable") && satisfied) {
      mentionablesConsumed++;
    }

    if (!satisfied) {
      if (types.length === 1) {
        switch (types[0]) {
          case "mentionable":
            return `${arg.name} requires a mention.`;
          case "replyable":
            return `${arg.name} requires a reply to a message.`;
          default:
            return `${arg.name} is required.`;
        }
      }

      const labels = types.map((t) => {
        if (t === "mentionable") return "a mention";
        if (t === "replyable") return "a reply";
        return "a value";
      });

      return `${arg.name} requires ${labels.slice(0, -1).join(", ")} or ${labels.at(-1)}.`;
    }
  }

  return null;
}

async function isAdmin(vyn: VynClient, userID: string): Promise<boolean> {
  let thread = await vyn.client.threads.getInfo(userID);
  return thread.adminIDs.some((a: any) => a.id === userID) as boolean;
}

function formatValidationError(
  error: string,
  command: VynCommand,
  prefix: string,
): string {
  const argsInfo = command.argsInfo ?? [];
  const failedArgName = error.split(" ")[0];
  const failedArg = argsInfo.find((a) => a.name === failedArgName);

  const bodyLines: string[] = [];

  if (failedArg) {
    const types = Array.isArray(failedArg.type)
      ? failedArg.type
      : [failedArg.type];

    const typeLabel = types.length === 1 ? types[0] : types.join(" | ");
    bodyLines.push(`${typeLabel} "${failedArgName}" is required.`);
    bodyLines.push("");

    if (types.length > 1) {
      bodyLines.push(`accepts: ${oxfordOr(types)}`);
    }

    bodyLines.push(failedArg.description);
  } else {
    bodyLines.push(error);
  }

  return formatMsg({
    header: "Error!",
    subheader: command.name,
    body: bodyLines,
    footer: [`usage: ${usageFormatter(prefix, command)}`],
  });
}

function formatRuntimeError(error: Error, command: VynCommand): string {
  return formatMsg({
    header: "Error!",
    subheader: command.name,
    body: error.message,
    footer: ["An internal error occurred while executing the command."],
  });
}

function oxfordOr(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} or ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, or ${items.at(-1)}`;
}

export async function trycatch(
  ctx: ContextPayload,
  next: VynNext,
  _vyn: VynClient,
) {
  try {
    await next();
  } catch (error) {
    const e = error as Error & {
      command?: VynCommand;
      prefix?: string;
      isValidation?: boolean;
    };
    if (e.command && e.isValidation) {
      ctx.reply(formatValidationError(e.message, e.command, e.prefix ?? ""));
    } else if (e.command) {
      ctx.reply(formatRuntimeError(e, e.command));
    } else {
      ctx.reply(error instanceof Error ? error.message : String(error));
    }
  }
}

export async function handler(ctx: ContextPayload, vyn: VynClient) {
  const dispatcher = vyn.dispatcher;

  const command = resolveCommand(dispatcher, ctx.body);
  if (!command) return;

  if (command.adminOnly && !(await isAdmin(vyn, ctx.senderID))) {
    return;
  }

  const parsed = dispatcher.parser.parse(ctx.body, command, ctx.mentions);
  if (!parsed) return;

  const prefix = dispatcher.getPrefix(ctx.body);
  const validationError = validateArgs(ctx, parsed, command);
  if (validationError) {
    const err = Object.assign(new Error(validationError), {
      command,
      prefix,
      isValidation: true,
    });
    throw err;
  }

  const argsInfo = command.argsInfo ?? [];
  const argumentsObject = dispatcher.buildArgumentsObject(
    ctx,
    parsed,
    argsInfo,
  );
  const payload = dispatcher.buildExecutePayload(ctx, argumentsObject, prefix);

  try {
    await command.execute(payload);
  } catch (error) {
    throw Object.assign(error as Error, { command });
  }
}
