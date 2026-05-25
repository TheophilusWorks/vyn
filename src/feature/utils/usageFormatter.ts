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
  let buffer = "";
  let req = arg.required ?? false;

  switch (arg.type) {
    case "argument":
      buffer = argument(arg.name, req);
      break;
    case "enum":
      buffer = enumeration(arg.name, arg.choices, req);
      break;
    case "boolean":
      buffer = boolean(arg.name, req);
      break;
    case "number":
      buffer = number(arg.name, req);
      break;
    case "mentionable":
      buffer = mentionable(arg.name, req);
      break;
  }

  return buffer;
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
  return `${arg}:${priority(choices.join("|"), required)}`;
}

function argument(arg: string, required: boolean): string {
  return `${arg}:${priority("argument", required)}`;
}

function boolean(arg: string, required: boolean): string {
  return `${arg}:${priority("true|false", required)}`;
}

function number(arg: string, required: boolean): string {
  return `${arg}:${priority("number", required)}`;
}

function mentionable(arg: string, required: boolean): string {
  return `${arg}:${priority("@mentionable", required)}`;
}
