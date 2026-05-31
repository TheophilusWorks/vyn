import { VynArgument } from "../../types";
import { VynCommand } from "../../core/command/VynCommand";

export default function argumentExplainer(
  command: VynCommand,
): Map<string, string[]> {
  let buffer: Map<string, string[]> = new Map();

  for (let arg of command.argsInfo ?? []) {
    let priority = arg.required ? "Required" : "Optional";
    let typeKey = Array.isArray(arg.type) ? arg.type.join(" | ") : arg.type;
    let entries: string[] = buffer.get(typeKey) ?? [];

    entries.push(`'${arg.name}' - ${arg.description} (${priority})`);

    buffer.set(typeKey, entries);
  }

  return buffer;
}
