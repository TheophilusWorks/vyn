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
  private parser: VynCommandParser;

  constructor(
    private vyn: VynClient,
    private readonly registry: VynCommandRegistry,
    private readonly config: VynConfig,
  ) {
    this.parser = new VynCommandParser(this.config.prefix);
  }

  public async dispatch(ctx: MessageCreatePayload): Promise<void> {
    const command =
      this.registry.getCommand(this.peekCommandName(ctx.body)) ??
      this.registry.getCommandByAlias(this.peekCommandName(ctx.body));

    if (!command) return;

    const parsed = this.parser.parse(ctx.body, command);
    if (!parsed) return;

    const argsInfo = command.argsInfo ?? [];
    const argumentsObject = this.buildArgumentsObject(
      parsed,
      ctx.mentions,
      argsInfo,
    );
    const payload = this.buildExecutePayload(ctx, argumentsObject);

    await command.execute(payload);
  }

  private peekCommandName(body: string): string {
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

  private buildArgumentsObject(
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

      getNumber: (name) => {
        const raw = parsed.args.get(name) ?? null;
        if (raw === null) return null;
        const n = Number(raw);
        if (isNaN(n))
          throw new Error(`argument "${name}" expects a number, got "${raw}"`);
        return n;
      },

      getBoolean: (name) => {
        const raw = parsed.args.get(name) ?? null;
        if (raw === null) return null;
        if (raw === "true") return true;
        if (raw === "false") return false;
        throw new Error(
          `argument "${name}" expects true or false, got "${raw}"`,
        );
      },

      getMentionable: (index) => {
        const entry = mentionEntries[index];
        if (!entry) return null;
        return { id: entry[0], name: entry[1] };
      },

      getAllMentionable: () => (mentionEntries.length === 0 ? null : mentions),
    };
  }

  private buildExecutePayload(
    ctx: MessageCreatePayload,
    argumentsObject: ArgumentsObject,
  ): ExecutePayload {
    return Object.assign(ctx, { ...argumentsObject, vyn: this.vyn });
  }
}
