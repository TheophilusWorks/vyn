import { MessageCreatePayload } from "@theophilusdev/conduit";
import { VynCommandRegistry } from "./registry/VynCommandRegistry.js";
import { VynCommandParser, ParsedCommand } from "./command/VynCommandParser.js";
import {
  ArgumentsObject,
  ExecutePayload,
  VynArgument,
  VynConfig,
} from "../types.js";
import { VynClient } from "../VynClient.js";

export class VynDispatcher {
  public parser: VynCommandParser;

  constructor(
    private vyn: VynClient,
    public readonly registry: VynCommandRegistry,
    private readonly config: VynConfig,
  ) {
    this.parser = new VynCommandParser(this.config.prefix);
  }

  public peekCommandName(body: string): string {
    const prefixes = Array.isArray(this.config.prefix)
      ? this.config.prefix
      : [this.config.prefix];

    for (const prefix of prefixes) {
      if (body.startsWith(prefix)) {
        const withoutPrefix = body.slice(prefix.length).trim();
        return withoutPrefix.split(/\s+/)[0].toLowerCase();
      }
    }

    return "";
  }

  public buildArgumentsObject(
    parsed: ParsedCommand,
    mentions: Record<string, string>,
    argsInfo: VynArgument[],
  ): ArgumentsObject {
    const mentionEntries = Object.entries(mentions);

    // build a lookup of arg name -> type for coercion
    const argTypeMap = new Map<string, VynArgument["type"]>();
    for (const arg of argsInfo) {
      argTypeMap.set(arg.name, arg.type);
    }

    return {
      getRaw: () => parsed.rawArgs,

      getArgument: (name) => {
        const raw = parsed.args.get(name) ?? null;
        return raw;
      },

      getEnum: (name) => {
        const raw = parsed.args.get(name) ?? null;
        if (raw === null) return null;

        const argInfo = argsInfo.find((a) => a.name === name);
        if (!argInfo || argInfo.type !== "enum") {
          throw new Error(`argument "${name}" is not an enum type`);
        }

        if (!argInfo.choices.includes(raw)) {
          throw new Error(
            `argument "${name}" expects one of [${argInfo.choices.join(" | ")}], got "${raw}"`,
          );
        }

        return raw;
      },

      getNumber: (name) => {
        const raw = parsed.args.get(name) ?? null;
        if (raw === null) return null;
        const n = Number(raw);
        if (isNaN(n))
          throw new Error(`argument "${name}" expects a number, got "${raw}"`);
        return n;
      },

      getBoolean: (name) => {
        const raw = parsed.args.get(name) ?? "false";
        if (raw === "true") return true;
        if (raw === "false") return false;
        throw new Error(
          `argument "${name}" expects true or false, got "${raw}"`,
        );
      },

      getMentionable: (name) => {
        const mentionableArgs = argsInfo.filter(
          (a) => a.type === "mentionable",
        );
        const index = mentionableArgs.findIndex((a) => a.name === name);
        if (index === -1) return null;
        const entry = mentionEntries[index];
        if (!entry) return null;
        return { id: entry[0], name: entry[1] };
      },

      getAllMentionable: () => {
        return Object.fromEntries(
          Object.entries(mentions).map(([id, name]) => [id, { id, name }]),
        );
      },
    };
  }

  public getPrefix(body: string): string {
    let prefixes = Array.isArray(this.config.prefix)
      ? this.config.prefix
      : [this.config.prefix];
    let matchedPrefix = "";

    for (const prefix of prefixes) {
      if (body.startsWith(prefix) && prefix.length > matchedPrefix.length) {
        matchedPrefix = prefix;
        break;
      }
    }

    return matchedPrefix;
  }

  public buildExecutePayload(
    ctx: MessageCreatePayload,
    argumentsObject: ArgumentsObject,
    prefix: string,
  ): ExecutePayload {
    return Object.assign(ctx, { ...argumentsObject, vyn: this.vyn, prefix });
  }
}
