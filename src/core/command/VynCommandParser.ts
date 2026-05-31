import { VynCommandShape } from "../../types.js";

export interface ParsedCommand {
  command: string;
  args: Map<string, string>;
  raw: string;
  rawArgs: string; // everything after the command name, untrimmed
}

type NamedToken = { kind: "named"; key: string; value: string };
type PositionalToken = { kind: "positional"; value: string };
type Token = NamedToken | PositionalToken;

export class VynCommandParser {
  private readonly prefix: string | string[];

  constructor(prefix: string | string[]) {
    this.prefix = prefix;
  }

  public parse(input: string, command: VynCommandShape): ParsedCommand | null {
    const stripped = this.stripPrefix(input);
    if (stripped === null) return null;

    const [commandRaw, ...rest] = stripped.split(/\s+/);
    const commandName = commandRaw.toLowerCase();
    if (!commandName) return null;

    const argsInfo = command.argsInfo ?? [];
    const rawArgs = rest.join(" ");
    const body = rawArgs.trim();
    const tokens = body ? this.tokenize(body) : [];
    const args = this.resolve(tokens, argsInfo);

    return { command: commandName, args, raw: input, rawArgs };
  }

  private stripPrefix(input: string): string | null {
    const prefixes = Array.isArray(this.prefix) ? this.prefix : [this.prefix];
    for (const p of prefixes) {
      if (input.startsWith(p)) return input.slice(p.length).trim();
    }
    return null;
  }

  private tokenize(body: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < body.length) {
      while (i < body.length && body[i] === " ") i++;
      if (i >= body.length) break;

      const namedMatch = this.matchNamedKey(body, i);

      if (namedMatch) {
        i = namedMatch.end;
        while (i < body.length && body[i] === " ") i++;

        let value: string;
        let newIndex: number;

        if (body[i] === '"') {
          const quoted = this.readQuotedValue(body, i + 1);
          value = quoted.value;
          newIndex = quoted.end;
        } else {
          const greedy = this.readUntilNextKey(body, i);
          value = greedy.value.trimEnd();
          newIndex = greedy.end;
        }

        tokens.push({ kind: "named", key: namedMatch.key, value });
        i = newIndex;
      } else {
        if (body[i] === '"') {
          const quoted = this.readQuotedValue(body, i + 1);
          tokens.push({ kind: "positional", value: quoted.value });
          i = quoted.end;
        } else {
          const positional = this.readPositionalChunk(body, i);
          tokens.push({ kind: "positional", value: positional.value });
          i = positional.end;
        }
      }
    }

    return tokens;
  }

  private matchNamedKey(
    body: string,
    i: number,
  ): { key: string; end: number } | null {
    const match = /^([a-zA-Z_][\w-]*):/.exec(body.slice(i));
    if (!match) return null;
    return { key: match[1], end: i + match[0].length };
  }

  private readQuotedValue(
    body: string,
    i: number,
  ): { value: string; end: number } {
    let value = "";
    while (i < body.length) {
      if (body[i] === "\\" && body[i + 1] === '"') {
        value += '"';
        i += 2;
      } else if (body[i] === '"') {
        i++;
        break;
      } else {
        value += body[i++];
      }
    }
    return { value, end: i };
  }

  private readUntilNextKey(
    body: string,
    i: number,
  ): { value: string; end: number } {
    let value = "";
    while (i < body.length) {
      const remainingTrimmed = body.slice(i).trimStart();
      const spacesConsumed = body.slice(i).length - remainingTrimmed.length;
      const nextIsKey = /^[a-zA-Z_][\w-]*:/.test(remainingTrimmed);
      if (spacesConsumed > 0 && nextIsKey) break;
      value += body[i++];
    }
    return { value, end: i };
  }

  private readPositionalChunk(
    body: string,
    i: number,
  ): { value: string; end: number } {
    let value = "";
    while (i < body.length && body[i] !== " ") {
      value += body[i++];
    }
    return { value, end: i };
  }

  private resolve(
    tokens: Token[],
    argsInfo: VynCommandShape["argsInfo"],
  ): Map<string, string> {
    const args = new Map<string, string>();
    const inferrableSlots = (argsInfo ?? [])
      .filter((a) => a.type !== "mentionable" && a.type !== "replyable")
      .map((a) => a.name);

    const namedTokens = tokens.filter(
      (t): t is NamedToken => t.kind === "named",
    );
    const positionalTokens = tokens.filter(
      (t): t is PositionalToken => t.kind === "positional",
    );

    for (const token of namedTokens) {
      args.set(token.key, token.value);
    }

    let positionalCursor = 0;

    for (let slotIndex = 0; slotIndex < inferrableSlots.length; slotIndex++) {
      if (positionalCursor >= positionalTokens.length) break;

      const slotName = inferrableSlots[slotIndex];
      if (args.has(slotName)) continue;

      const remainingUnfilledSlots = inferrableSlots
        .slice(slotIndex + 1)
        .filter((s) => !args.has(s));

      const isLastUnfilledSlot = remainingUnfilledSlots.length === 0;

      if (isLastUnfilledSlot) {
        const remainingValues = positionalTokens
          .slice(positionalCursor)
          .map((t) => t.value);
        args.set(slotName, remainingValues.join(" "));
        positionalCursor = positionalTokens.length;
      } else {
        args.set(slotName, positionalTokens[positionalCursor].value);
        positionalCursor++;
      }
    }

    return args;
  }
}
