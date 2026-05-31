import { VynCommand } from "../../core/command/VynCommand";
import { VynArgument } from "../../types";

export function usageFormatter(prefix: string, command: VynCommand): string {
  let buffer: string[] = [];

  if (!command.argsInfo || command.argsInfo.length <= 0)
    return `${prefix}${command.name}`;

  for (let arg of command.argsInfo) {
    buffer.push(formarArg(arg));
  }

  return `${prefix}${command.name}` + " " + buffer.join(" ");
}

function formarArg(arg: VynArgument): string {
  const req = arg.required ?? false;
  const types = Array.isArray(arg.type) ? arg.type : [arg.type];

  const parts = types.map((t) => {
    switch (t) {
      case "argument":
        return argument(arg.name, req);
      case "enum":
        return enumeration(arg.name, (arg as any).choices, req);
      case "boolean":
        return boolean(arg.name, req);
      case "number":
        return number(arg.name, req);
      case "mentionable":
        return mentionable(arg.name, req);
      case "replyable":
        return replyable(arg.name, req);
      default:
        return "";
    }
  });

  if (parts.length > 1) {
    const inner = types
      .map((t) => {
        switch (t) {
          case "mentionable":
            return "@mention";
          case "replyable":
            return "reply";
          case "boolean":
            return "true | false";
          case "number":
            return "number";
          case "argument":
            return "text";
          case "enum":
            return (arg as any).choices?.join(" | ") ?? "enum";
          default:
            return t;
        }
      })
      .join(" | ");
    const req = arg.required ?? false;
    return `${arg.name}:${priority(inner, req)}`;
  }

  return parts[0];
}

function priority(arg: string, required: boolean): string {
  let left = required ? "<" : "(";
  let right = required ? ">" : ")";

  return left + arg + right;
}

function enumeration(
  arg: string,
  choices: string[],
  required: boolean,
): string {
  return `${arg}:${priority(choices.join(" | "), required)}`;
}

function replyable(arg: string, required: boolean): string {
  return `${arg}:${priority("replyable", required)}`;
}

function argument(arg: string, required: boolean): string {
  return `${arg}:${priority("argument", required)}`;
}

function boolean(arg: string, required: boolean): string {
  return `${arg}:${priority("true | false", required)}`;
}

function number(arg: string, required: boolean): string {
  return `${arg}:${priority("number", required)}`;
}

function mentionable(arg: string, required: boolean): string {
  return `${arg}:${priority("@mentionable", required)}`;
}
